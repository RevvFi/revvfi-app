"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits, type Address } from "viem";
import { toast } from "sonner";
import { auctionService } from "@/services/auction.service";
import { queryKeys } from "@/constants/query-keys";
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
