"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWriteContract, usePublicClient } from "wagmi";
import { type Address } from "viem";
import { toast } from "sonner";
import { auctionService } from "@/services/auction.service";
import { localChain } from "@/constants/chains";
import type { Auction } from "@/types";
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

// ─── Inline ABI fragments (avoid casting the full compiled ABI) ───────────────

const LIQUIDATION_STATUS_ABI = [
  {
    name: "isLiquidatable",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getCollateralRatio",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getTotalOwed",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

const LIQUIDATE_ABI = [
  {
    name: "liquidate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

// ─── Market liquidation status (on-chain read) ────────────────────────────────

export function useLiquidationStatus(marketAddress?: string) {
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useQuery({
    queryKey: ["liquidation-status", marketAddress],
    queryFn: async () => {
      if (!marketAddress || !publicClient) return null;
      const addr = marketAddress as `0x${string}`;

      const [isLiquidatable, collateralRatio, totalOwed] = await Promise.all([
        publicClient.readContract({
          address: addr,
          abi: LIQUIDATION_STATUS_ABI,
          functionName: "isLiquidatable",
        }),
        publicClient.readContract({
          address: addr,
          abi: LIQUIDATION_STATUS_ABI,
          functionName: "getCollateralRatio",
        }),
        publicClient.readContract({
          address: addr,
          abi: LIQUIDATION_STATUS_ABI,
          functionName: "getTotalOwed",
        }),
      ]);

      // With zero debt, getCollateralRatio() returns a type(uint256).max
      // sentinel ("infinite ratio") - dividing that by 10000 for display
      // produces a meaningless ~1.16e73 instead of an actual health factor.
      // Represent it as Infinity and let callers render "no debt" instead.
      const hasNoDebt = (totalOwed as bigint) === BigInt(0);
      // collateralRatio is basis points (e.g. 12000 = 120%)
      // Divide by 10000 → ratio where < 1.0 means liquidatable
      const healthFactor = hasNoDebt ? Infinity : Number(collateralRatio) / 10000;
      return { isLiquidatable, healthFactor, hasNoDebt };
    },
    enabled: !!marketAddress && !!publicClient,
    refetchInterval: 15_000,
  });
}

// ─── Active auction for a specific market (API read) ─────────────────────────

export function useActiveAuction(marketAddress?: string) {
  return useQuery({
    queryKey: ["active-auction", marketAddress],
    queryFn: async (): Promise<Auction | null> => {
      if (!marketAddress) return null;
      try {
        const data = await auctionService.getAuctionsByMarket(marketAddress, "active");
        return data.auctions?.[0] ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!marketAddress,
    refetchInterval: 10_000,
  });
}

// ─── Dutch auction price + discount % (polling every 10s) ───────────────────

export function useDutchAuctionPrice(auction: Auction | null | undefined) {
  return useQuery({
    queryKey: ["dutch-auction-price", auction?.auction_id],
    queryFn: () => {
      if (!auction) return { currentPrice: BigInt(0), discount: 0 };

      const now = Math.floor(Date.now() / 1000);
      const duration = auction.end_time - auction.start_time;

      if (duration <= 0) return { currentPrice: BigInt(0), discount: 0 };

      const elapsed = now - auction.start_time;

      if (elapsed <= 0) {
        return { currentPrice: BigInt(auction.debt_amount), discount: 0 };
      }
      if (elapsed >= duration) {
        return { currentPrice: BigInt(0), discount: 100 };
      }

      const discountPct = (elapsed / duration) * 100;
      // Linear decay: price = debtAmount × (1 - discount/100)
      const debtBigInt = BigInt(auction.debt_amount);
      const multiplier = BigInt(Math.floor((1 - discountPct / 100) * 10_000));
      const currentPrice = (debtBigInt * multiplier) / BigInt(10_000);

      return { currentPrice, discount: discountPct };
    },
    enabled: !!auction,
    refetchInterval: 10_000,
  });
}

// Simpler hook for just the discount percentage (used on market detail page)
export function useAuctionDiscount(auction: Auction | null | undefined): number {
  if (!auction) return 0;
  const now = Math.floor(Date.now() / 1000);
  const duration = auction.end_time - auction.start_time;
  if (duration <= 0) return 0;
  const elapsed = now - auction.start_time;
  if (elapsed <= 0) return 0;
  if (elapsed >= duration) return 100;
  return (elapsed / duration) * 100;
}

// ─── On-chain check: is market currently in liquidation? ─────────────────────

const IS_LIQUIDATING_ABI = [
  {
    name: "isLiquidating",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
] as const;

export function useIsLiquidating(marketAddress?: string) {
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useQuery({
    queryKey: ["is-liquidating", marketAddress],
    queryFn: async () => {
      if (!marketAddress || !publicClient) return false;
      return publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: IS_LIQUIDATING_ABI,
        functionName: "isLiquidating",
      });
    },
    enabled: !!marketAddress && !!publicClient,
    refetchInterval: 15_000,
  });
}

// ─── Trigger liquidation (blockchain write) ──────────────────────────────────

export interface TriggerLiquidationParams {
  marketAddress: Address;
}

export function useTriggerLiquidation() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress }: TriggerLiquidationParams) => {
      await ensureLocalChain();
      toast.info("Triggering liquidation…");
      const txHash = await writeContractAsync({
        address: marketAddress,
        abi: LIQUIDATE_ABI,
        functionName: "liquidate",
        chainId: localChain.id,
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction failed");
      return txHash;
    },
    // Use mutation variables so we can invalidate the exact market's cached queries
    onSuccess: (_, { marketAddress }) => {
      // Prefix-based: invalidates all ["auctions", ...] queries (detail, list, liquidations)
      qc.invalidateQueries({ queryKey: ["auctions"] });
      // Prefix-based: invalidates all ["markets", ...] queries
      qc.invalidateQueries({ queryKey: ["markets"] });
      // Prefix-based: on-chain market reads (collateral ratio, health, etc.)
      qc.invalidateQueries({ queryKey: ["market"] });
      // Market-specific: liquidation-status card on market detail page
      qc.invalidateQueries({ queryKey: ["liquidation-status", marketAddress] });
      // Market-specific: active-auction card on market detail page
      qc.invalidateQueries({ queryKey: ["active-auction", marketAddress] });
      toast.success("Liquidation triggered! Dutch auction started.");
    },
    onError: (e: Error) => {
      console.error("Trigger liquidation failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("AlreadyLiquidating")) {
        toast.error("Market is already in liquidation — someone else triggered it first. You can bid on the existing auction instead.");
      } else if (e.message?.includes("InsufficientCollateral")) {
        // Market.liquidate() reverts with this same error (reused) when
        // !isLiquidatable() - i.e. the position recovered above the
        // threshold (e.g. price moved back up) since it was last checked.
        toast.error("Market is no longer eligible for liquidation");
      } else {
        toast.error(e.message || "Failed to trigger liquidation");
      }
    },
  });
}
