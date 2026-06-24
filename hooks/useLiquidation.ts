"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits, type Address } from "viem";
import { toast } from "sonner";
import { auctionService } from "@/services/auction.service";
import { queryKeys } from "@/constants/query-keys";
import { LIQUIDATOR_ABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
export function useAuctions() {
  return useQuery({
    queryKey: queryKeys.auctions.liquidations(),
    queryFn: () => auctionService.getLiquidations(),
  });
}

export function useAuction(auctionId: number) {
  return useQuery({
    queryKey: queryKeys.auctions.detail(auctionId),
    queryFn: () => auctionService.getAuction(auctionId),
    enabled: auctionId > 0,
  });
}

export function useAuctionPrice(auctionId: number) {
  return useQuery({
    queryKey: ["auction-price", auctionId],
    queryFn: () => auctionService.getAuctionPrice(auctionId),
    enabled: auctionId > 0,
    refetchInterval: 30_000, // Refresh every 30s (Dutch auction price decreases)
  });
}

export interface PlaceBidParams {
  auctionId: number;
  bidAmount: string;
  borrowAsset: Address;
  borrowAssetDecimals: number;
}

export function usePlaceBid() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({
      auctionId,
      bidAmount,
      borrowAsset,
      borrowAssetDecimals,
    }: PlaceBidParams) => {
      const bidWei = parseUnits(bidAmount, borrowAssetDecimals);
      const liquidatorAddr = CONTRACT_ADDRESSES.liquidator;

      // Step 1: Approve Liquidator to spend bid asset
      toast.info("Step 1/2: Approving bid amount to Liquidator…");
      const approveTx = await writeContractAsync({
        address: borrowAsset,
        abi: erc20Abi,
        functionName: "approve",
        args: [liquidatorAddr, bidWei],
      });
      await publicClient!.waitForTransactionReceipt({ hash: approveTx });

      // Step 2: Place bid on auction
      toast.info("Step 2/2: Placing bid on auction…");
      const bidTx = await writeContractAsync({
        address: liquidatorAddr,
        abi: LIQUIDATOR_ABI,
        functionName: "placeBid",
        args: [BigInt(auctionId), bidWei],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: bidTx });

      if (receipt.status !== 'success') {
        throw new Error("Transaction failed");
      }

      return bidTx;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.liquidations() });
      toast.success("Bid placed successfully!");
    },
    onError: (e: Error) => {
      console.error("Place bid failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("BidTooLow")) {
        toast.error("Bid must be higher than current bid");
      } else if (e.message?.includes("AuctionEnded")) {
        toast.error("Auction has already ended");
      } else if (e.message?.includes("BidExceedsDebt")) {
        toast.error("Bid exceeds original debt amount");
      } else if (e.message?.includes("InsufficientBalance")) {
        toast.error("Insufficient balance to place bid");
      } else {
        toast.error(e.message || "Failed to place bid");
      }
    },
  });
}

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
        abi: [
          {
            name: "liquidate",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [],
            outputs: [],
          },
        ] as const,
        functionName: "liquidate",
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error("Transaction failed");
      }

      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.liquidations() });
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      toast.success("Liquidation triggered successfully!");
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
