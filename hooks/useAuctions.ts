"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits, type Address } from "viem";
import { toast } from "sonner";
import { auctionService } from "@/services/auction.service";
import { queryKeys } from "@/constants/query-keys";
import type { Auction } from "@/types";
import { LIQUIDATOR_ABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

export function useLiquidations() {
  return useQuery({
    queryKey: queryKeys.auctions.liquidations(),
    queryFn: auctionService.getLiquidations,
    refetchInterval: 15_000,
  });
}

export function useAuction(id: number) {
  return useQuery({
    queryKey: queryKeys.auctions.detail(id),
    queryFn: () => auctionService.getAuction(id),
    enabled: id > 0,
    refetchInterval: 10_000,
  });
}

export function useAuctionPrice(id: number) {
  return useQuery({
    queryKey: queryKeys.auctions.price(id),
    queryFn: () => auctionService.getAuctionPrice(id),
    enabled: id > 0,
    refetchInterval: 5_000,
  });
}

export function useCountdown(endTime: number) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, endTime - Math.floor(Date.now() / 1000))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, endTime - Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return remaining;
}

export interface PlaceBidParams {
  auctionId: number;
  bidAmount: string;
  borrowAssetAddress: string;
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
      borrowAssetAddress,
      borrowAssetDecimals,
    }: PlaceBidParams) => {
      const bidWei = parseUnits(bidAmount, borrowAssetDecimals);
      const tokenAddr = borrowAssetAddress as Address;

      // Step 1 — approve Liquidator to pull bid amount from bidder
      toast.info("Step 1/2: Approving bid spend…");
      const approveTx = await writeContractAsync({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.liquidator, bidWei],
      });
      await publicClient!.waitForTransactionReceipt({ hash: approveTx });

      // Step 2 — place bid on Liquidator
      toast.info("Step 2/2: Placing bid on-chain…");
      const bidTx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.liquidator,
        abi: LIQUIDATOR_ABI,
        functionName: "placeBid",
        args: [BigInt(auctionId), bidWei],
      });
      await publicClient!.waitForTransactionReceipt({ hash: bidTx });
      return bidTx;
    },
    onSuccess: (_, { auctionId }) => {
      // All auction list queries (liquidations list, auction detail)
      qc.invalidateQueries({ queryKey: ["auctions"] });
      // Specific auction detail so bid amount + status update immediately
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) });
      // Active-auction card on market detail page — bid may settle the auction
      qc.invalidateQueries({ queryKey: ["active-auction"] });
      // Liquidation-status card — settling an auction changes market health state
      qc.invalidateQueries({ queryKey: ["liquidation-status"] });
      toast.success("Bid placed successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSettleAuction() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({ auctionId }: { auctionId: number }) => {
      toast.info("Settling auction…");
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.liquidator,
        abi: LIQUIDATOR_ABI,
        functionName: "settleAuction",
        args: [BigInt(auctionId)],
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success") throw new Error("Settlement transaction failed");
      return tx;
    },
    onSuccess: (_, { auctionId }) => {
      qc.invalidateQueries({ queryKey: ["auctions"] });
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) });
      qc.invalidateQueries({ queryKey: ["active-auction"] });
      qc.invalidateQueries({ queryKey: ["liquidation-status"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
      qc.invalidateQueries({ queryKey: ["my-bids"] });
      toast.success("Auction settled! Collateral transferred to your wallet.");
    },
    onError: (e: Error) => {
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("AuctionNotEnded")) {
        toast.error("Auction hasn't ended yet");
      } else if (e.message?.includes("AuctionNotActive")) {
        toast.error("Auction is not active or already settled");
      } else if (e.message?.includes("NoBids")) {
        toast.error("No bids placed on this auction");
      } else {
        toast.error(e.message || "Failed to settle auction");
      }
    },
  });
}

export function useMyBids(userAddress?: string) {
  return useQuery({
    queryKey: ["my-bids", userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      const data = await auctionService.getLiquidations();
      return (data.auctions ?? []).filter(
        (a) => a.highest_bidder?.toLowerCase() === userAddress.toLowerCase()
      );
    },
    enabled: !!userAddress,
    refetchInterval: 30_000,
  });
}

export function useCanSettle(auction: Auction | null, userAddress?: string) {
  if (!auction || !userAddress) return { canSettle: false, reason: "No auction or user" as string };

  const isHighestBidder =
    auction.highest_bidder?.toLowerCase() === userAddress.toLowerCase();

  const now = Math.floor(Date.now() / 1000);
  const auctionEnded = now >= auction.end_time;
  const hasBids = auction.highest_bid && BigInt(auction.highest_bid) > BigInt(0);
  const bidCoversDebt =
    hasBids && BigInt(auction.highest_bid) >= BigInt(auction.debt_amount);

  const canSettle = auction.status === "active" && (auctionEnded || !!bidCoversDebt);

  return {
    canSettle,
    isHighestBidder,
    auctionEnded,
    bidCoversDebt,
    reason: !canSettle
      ? auctionEnded
        ? "Auction ended but no valid bids"
        : "Auction still active. Wait for end time or bid the full debt amount."
      : null,
  };
}
