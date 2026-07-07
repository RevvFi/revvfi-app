"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { toast } from "sonner";
import { offerService, type OffersParams } from "@/services/offer.service";
import { queryKeys } from "@/constants/query-keys";
import { MARKET_ABI, OFFER_BOOK_ABI } from "@/lib/contracts/abis";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "@/providers/wagmi-config";
import { localChain } from "@/constants/chains";
import type { CreateOfferRequest, QuoteRequest } from "@/types";
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

export interface CreateOfferOnChainParams extends CreateOfferRequest {
  borrow_asset_address: string;
  borrow_asset_decimals: number;
}

export function useOffers(params?: OffersParams) {
  return useQuery({
    queryKey: queryKeys.offers.all(params),
    queryFn: () => offerService.getOffers(params),
    // /offers requires either market_address or lender server-side (it 400s
    // otherwise, rather than dumping the whole table) - don't fire before
    // one of them is actually available (e.g. wallet not connected yet).
    enabled: !!params?.market_address || !!params?.lender,
    // An offer's fill state changes from someone ELSE's action (a borrower
    // matching it) - refetchOnWindowFocus is globally off, so without
    // polling this would never update until a full page reload.
    refetchInterval: 15_000,
  });
}

/**
 * Resolve a Market's OfferBook clone address on-chain.
 *
 * The backend's `offers` table is keyed by the address that actually emits
 * offer events — the per-market OfferBook clone — not the Market contract
 * itself. Every offers/quote query must use this address, or the API will
 * (silently, since it's a valid-but-empty query) return zero results.
 * The mapping is immutable per market, so it's safe to cache indefinitely.
 */
export function useOfferBookAddress(marketAddress: string | undefined) {
  return useQuery({
    queryKey: ["offerBookAddress", marketAddress],
    queryFn: async () =>
      (await readContract(wagmiConfig, {
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "offerBook",
        chainId: localChain.id,
      })) as `0x${string}`,
    enabled: !!marketAddress,
    staleTime: Infinity,
  });
}

/**
 * Get all offers (any status) for a specific market, keyed by the market's
 * own address — resolves the underlying OfferBook address internally so
 * callers never need to know about the Market/OfferBook address split.
 */
export function useOffersForMarket(marketAddress: string | undefined) {
  const { data: offerBookAddr } = useOfferBookAddress(marketAddress);
  return useQuery({
    queryKey: ["offers", "allByMarket", marketAddress],
    queryFn: () => offerService.getOffers({ market_address: offerBookAddr }),
    enabled: !!marketAddress && !!offerBookAddr,
  });
}

/**
 * Get all offers created by a specific lender (across all markets).
 * Used in Settings → My Offers to let lenders track and manage their positions.
 */
export function useMyOffers(lenderAddress: string | undefined) {
  return useQuery({
    queryKey: ["offers", "byLender", lenderAddress],
    queryFn: () => offerService.getOffers({ lender: lenderAddress }),
    enabled: !!lenderAddress,
    refetchInterval: 15_000,
  });
}

/**
 * Get all active offers for a specific market
 * Used by borrowers to see available liquidity
 */
export function useMarketOffers(marketAddress: string | undefined) {
  const { data: offerBookAddr } = useOfferBookAddress(marketAddress);
  return useQuery({
    queryKey: ['offers', 'byMarket', marketAddress],
    queryFn: () => offerService.getOffers({
      market_address: offerBookAddr,
      status: 'active'
    }),
    enabled: !!marketAddress && !!offerBookAddr,
    refetchInterval: 30_000, // Refresh every 30 seconds
  });
}

export function useOffer(id: number) {
  return useQuery({
    queryKey: queryKeys.offers.detail(id),
    queryFn: () => offerService.getOffer(id),
    enabled: id > 0,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async (payload: CreateOfferOnChainParams) => {
      await ensureLocalChain();
      const {
        borrow_asset_address,
        borrow_asset_decimals,
        market_address,
        amount,
        apr,
        seniority,
        expiry_days,
      } = payload;

      const amountWei = parseUnits(amount, borrow_asset_decimals);
      const marketAddr = market_address as `0x${string}`;
      const tokenAddr = borrow_asset_address as `0x${string}`;
      const durationSecs = BigInt(expiry_days * 86400);

      // Get OfferBook address from Market contract
      toast.info("Getting OfferBook address…");
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddr,
        abi: MARKET_ABI,
        functionName: "offerBook",
        chainId: localChain.id,
      })) as `0x${string}`;

      // Step 1 — approve the OfferBook to pull borrow asset from lender
      toast.info("Step 1/2: Approving token spend to OfferBook…");
      const approveTx = await writeContractAsync({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: "approve",
        args: [offerBookAddr, amountWei],
        chainId: localChain.id,
      });
      const approveReceipt = await publicClient!.waitForTransactionReceipt({ hash: approveTx });
      if (approveReceipt.status !== "success") throw new Error("Approval transaction failed");

      // Step 2 — submit offer on-chain via OfferBook
      toast.info("Step 2/2: Submitting offer to OfferBook…");
      const offerTx = await writeContractAsync({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: "submitOffer",
        args: [amountWei, BigInt(apr), seniority, durationSecs],
        chainId: localChain.id,
      });
      const offerReceipt = await publicClient!.waitForTransactionReceipt({ hash: offerTx });
      if (offerReceipt.status !== "success") throw new Error("Offer submission transaction failed");

      // Step 3 — sync backend (best-effort; backend may also index from events)
      try {
        await offerService.createOffer({ market_address, amount, apr, seniority, expiry_days });
      } catch {
        // non-fatal: on-chain is the source of truth
      }

      return offerTx;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offers.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      // My-offers list (useMyOffers uses ['offers', 'byLender', ...])
      qc.invalidateQueries({ queryKey: ["offers"] });
      // Offer book reads (liquidity totals, active-offer count, best-offers preview)
      qc.invalidateQueries({ queryKey: ["offerBook"] });
      toast.success("Offer submitted successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelOffer() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    // The `offers` API/table's `market_address` field is actually the
    // OfferBook clone's address (offer events are emitted by OfferBook, not
    // Market) - every caller already has this address on hand from the
    // offer object itself, so accept it directly instead of re-deriving it
    // via Market.offerBook(). Passing a real Market address here used to
    // "work" for callers that happened to resolve one first, but reverted
    // for anyone who (correctly, per the offers table) passed the OfferBook
    // address straight through - OfferBook has no offerBook() function.
    mutationFn: async ({ offerId, offerBookAddress }: { offerId: number; offerBookAddress: string }) => {
      await ensureLocalChain();
      toast.info("Cancelling offer on-chain…");
      const txHash = await writeContractAsync({
        address: offerBookAddress as `0x${string}`,
        abi: OFFER_BOOK_ABI,
        functionName: "cancelOffer",
        args: [BigInt(offerId)],
        chainId: localChain.id,
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Cancel transaction reverted on-chain — the offer may already be fully filled or cancelled");

      // Step 3: Sync backend (best-effort)
      try {
        await offerService.cancelOffer(offerId);
      } catch {
        // non-fatal: indexer will sync from events
      }
      return txHash;
    },
    onSuccess: () => {
      // All offer queries (list, byMarket, byLender)
      qc.invalidateQueries({ queryKey: ["offers"] });
      // Offer book reads (liquidity totals, active-offer count)
      qc.invalidateQueries({ queryKey: ["offerBook"] });
      toast.success("Offer cancelled successfully");
    },
    onError: (e: Error) => {
      console.error("Cancel offer failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("OfferNotFound")) {
        toast.error("Offer not found or already cancelled");
      } else {
        toast.error(e.message || "Failed to cancel offer");
      }
    },
  });
}

export function useQuote(params?: QuoteRequest) {
  const { data: offerBookAddr } = useOfferBookAddress(params?.market_address);
  return useQuery({
    queryKey: queryKeys.offers.quote(params),
    queryFn: () => offerService.getQuote({ ...params!, market_address: offerBookAddr! }),
    enabled: !!params?.market_address && !!params.borrow_amount && !!offerBookAddr,
  });
}

export interface CleanupExpiredOffersParams {
  marketAddress: string;
  maxCleanup?: number;
}

/**
 * Cleanup expired offers in the OfferBook
 * This is a utility function anyone can call to help maintain the offer book
 * @param maxCleanup Maximum number of offers to cleanup in one transaction (default: 10)
 */
export function useCleanupExpiredOffers() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress, maxCleanup = 10 }: CleanupExpiredOffersParams) => {
      await ensureLocalChain();
      // Get OfferBook address from Market contract
      toast.info("Getting OfferBook address…");
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "offerBook",
        chainId: localChain.id,
      })) as `0x${string}`;

      // Call OfferBook.cleanupExpiredOffers()
      toast.info(`Cleaning up expired offers...`);
      const txHash = await writeContractAsync({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: "cleanupExpiredOffers",
        args: [BigInt(maxCleanup)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Cleanup transaction reverted on-chain");
      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offers.all() });
      toast.success("Expired offers cleaned up successfully");
    },
    onError: (e: Error) => {
      console.error("Cleanup expired offers failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(e.message || "Failed to cleanup expired offers");
      }
    },
  });
}
