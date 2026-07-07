"use client";

import { useQueries } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "@/providers/wagmi-config";
import { localChain } from "@/constants/chains";
import { useMarkets } from "./useMarkets";
import type { Market } from "@/types";

const LIQUIDATION_CHECK_ABI = [
  {
    name: "isLiquidatable",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    name: "isLiquidating",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
] as const;

export interface AtRiskMarket {
  market: Market;
}

/**
 * Markets currently below their liquidation threshold, across the whole
 * protocol, that don't already have an auction running.
 *
 * There was previously no way for a lender to discover this without already
 * knowing which specific market to check on its own detail page - the
 * Auctions page only listed auctions that someone had already triggered.
 * isLiquidatable() is a live/dynamic computed value (debt keeps accruing
 * interest, collateral value can move) with no backing on-chain event, so
 * the backend can't index it - this does a parallel live read per active
 * market instead.
 *
 * Also live-checks isLiquidating() per market rather than trusting only the
 * backend's is_liquidating flag: that flag depends on the indexer having
 * already processed the LiquidationStarted event, and a lender clicking
 * "Trigger Liquidation" a moment after someone else already did (before the
 * indexer catches up) would otherwise still see the button and get a
 * guaranteed on-chain revert.
 */
export function useAtRiskMarkets() {
  const { data: marketsData, isLoading: marketsLoading } = useMarkets({ is_active: true });
  const marketList = (marketsData?.markets ?? []).filter((m) => !m.is_liquidating);

  const results = useQueries({
    queries: marketList.map((m) => ({
      queryKey: ["atRiskCheck", m.address],
      queryFn: async () => {
        const [isLiquidatable, isLiquidating] = await Promise.all([
          readContract(wagmiConfig, {
            address: m.address as `0x${string}`,
            abi: LIQUIDATION_CHECK_ABI,
            functionName: "isLiquidatable",
            chainId: localChain.id,
          }),
          readContract(wagmiConfig, {
            address: m.address as `0x${string}`,
            abi: LIQUIDATION_CHECK_ABI,
            functionName: "isLiquidating",
            chainId: localChain.id,
          }),
        ]);
        return { isLiquidatable, isLiquidating } as { isLiquidatable: boolean; isLiquidating: boolean };
      },
      enabled: !!m.address,
      refetchInterval: 10_000,
    })),
  });

  const atRiskMarkets: AtRiskMarket[] = marketList
    .filter((_, i) => results[i]?.data?.isLiquidatable === true && results[i]?.data?.isLiquidating === false)
    .map((market) => ({ market }));

  return {
    atRiskMarkets,
    isLoading: marketsLoading || results.some((r) => r.isLoading),
  };
}
