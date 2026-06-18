"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { auctionService } from "@/services/auction.service";
import { transactionService } from "@/services/transaction.service";
import { queryKeys } from "@/constants/query-keys";
import type { LiquidateRequest } from "@/types";
import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";

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

export function usePlaceBid() {
  const qc = useQueryClient();
  const { sendTransactionAsync } = useSendTransaction();

  return useMutation({
    mutationFn: async (payload: LiquidateRequest) => {
      const unsigned = await transactionService.buildLiquidateTx(payload);
      const hash = await sendTransactionAsync({
        to: unsigned.to as `0x${string}`,
        data: unsigned.data as `0x${string}`,
        value: BigInt(unsigned.value),
      });
      return hash;
    },
    onSuccess: (hash) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.liquidations() });
      toast.success(`Bid submitted: ${hash.slice(0, 10)}…`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
