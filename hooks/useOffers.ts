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
import type { CreateOfferRequest, QuoteRequest } from "@/types";

export interface CreateOfferOnChainParams extends CreateOfferRequest {
  borrow_asset_address: string;
  borrow_asset_decimals: number;
}

export function useOffers(params?: OffersParams) {
  return useQuery({
    queryKey: queryKeys.offers.all(params),
    queryFn: () => offerService.getOffers(params),
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
  return useQuery({
    queryKey: ['offers', 'byMarket', marketAddress],
    queryFn: () => offerService.getOffers({
      market_address: marketAddress,
      status: 'active'
    }),
    enabled: !!marketAddress,
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
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async (payload: CreateOfferOnChainParams) => {
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
      })) as `0x${string}`;

      // Step 1 — approve the OfferBook to pull borrow asset from lender
      toast.info("Step 1/2: Approving token spend to OfferBook…");
      const approveTx = await writeContractAsync({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: "approve",
        args: [offerBookAddr, amountWei],
      });
      await publicClient!.waitForTransactionReceipt({ hash: approveTx });

      // Step 2 — submit offer on-chain via OfferBook
      toast.info("Step 2/2: Submitting offer to OfferBook…");
      const offerTx = await writeContractAsync({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: "submitOffer",
        args: [amountWei, BigInt(apr), seniority, durationSecs],
      });
      await publicClient!.waitForTransactionReceipt({ hash: offerTx });

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
      toast.success("Offer submitted successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelOffer() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({ offerId, marketAddress }: { offerId: number; marketAddress: string }) => {
      // Step 1: Read OfferBook address from Market contract
      toast.info("Getting OfferBook address…");
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "offerBook",
      })) as `0x${string}`;

      // Step 2: Cancel offer on OfferBook (not Market!)
      toast.info("Cancelling offer on-chain…");
      const txHash = await writeContractAsync({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: "cancelOffer",
        args: [BigInt(offerId)],
      });
      await publicClient!.waitForTransactionReceipt({ hash: txHash });

      // Step 3: Sync backend (best-effort)
      try {
        await offerService.cancelOffer(offerId);
      } catch {
        // non-fatal: indexer will sync from events
      }
      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offers.all() });
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
  return useQuery({
    queryKey: queryKeys.offers.quote(params),
    queryFn: () => offerService.getQuote(params!),
    enabled: !!params?.market_address && !!params.borrow_amount,
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
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({ marketAddress, maxCleanup = 10 }: CleanupExpiredOffersParams) => {
      // Get OfferBook address from Market contract
      toast.info("Getting OfferBook address…");
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "offerBook",
      })) as `0x${string}`;

      // Call OfferBook.cleanupExpiredOffers()
      toast.info(`Cleaning up expired offers...`);
      const txHash = await writeContractAsync({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: "cleanupExpiredOffers",
        args: [BigInt(maxCleanup)],
      });

      await publicClient!.waitForTransactionReceipt({ hash: txHash });
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
