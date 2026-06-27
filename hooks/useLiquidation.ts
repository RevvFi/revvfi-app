"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWriteContract, usePublicClient } from "wagmi";
import { type Address } from "viem";
import { toast } from "sonner";
import { auctionService } from "@/services/auction.service";
import type { Auction } from "@/types";

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
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["liquidation-status", marketAddress],
    queryFn: async () => {
      if (!marketAddress || !publicClient) return null;
      const addr = marketAddress as `0x${string}`;

      const [isLiquidatable, collateralRatio] = await Promise.all([
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
      ]);

      // collateralRatio is basis points (e.g. 12000 = 120%)
      // Divide by 10000 → ratio where < 1.0 means liquidatable
      const healthFactor = Number(collateralRatio) / 10000;
      return { isLiquidatable, healthFactor };
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

// ─── Dutch auction discount % (pure calculation, not a query) ────────────────

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

// ─── Trigger liquidation (blockchain write) ──────────────────────────────────

export interface TriggerLiquidationParams {
  marketAddress: Address;
}

export function useTriggerLiquidation() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({ marketAddress }: TriggerLiquidationParams) => {
      toast.info("Triggering liquidation…");
      const txHash = await writeContractAsync({
        address: marketAddress,
        abi: LIQUIDATE_ABI,
        functionName: "liquidate",
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
      } else if (e.message?.includes("NotLiquidatable")) {
        toast.error("Market is not eligible for liquidation");
      } else if (e.message?.includes("AlreadyLiquidating")) {
        toast.error("Market is already in liquidation");
      } else {
        toast.error(e.message || "Failed to trigger liquidation");
      }
    },
  });
}
