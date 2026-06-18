"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { marketService, type MarketsParams } from "@/services/market.service";
import { queryKeys } from "@/constants/query-keys";
import type { CreateMarketRequest } from "@/types";

export function useMarkets(params?: MarketsParams) {
  return useQuery({
    queryKey: queryKeys.markets.all(params),
    queryFn: () => marketService.getMarkets(params),
  });
}

export function useMarket(address: string) {
  return useQuery({
    queryKey: queryKeys.markets.detail(address),
    queryFn: () => marketService.getMarket(address),
    enabled: !!address,
  });
}

export function useMarketMetrics(address: string) {
  return useQuery({
    queryKey: queryKeys.markets.metrics(address),
    queryFn: () => marketService.getMarketMetrics(address),
    enabled: !!address,
    refetchInterval: 30_000,
  });
}

export function useCreateMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMarketRequest) => marketService.createMarket(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      toast.success("Market created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
