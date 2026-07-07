"use client";

import { useQueries } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "@/providers/wagmi-config";
import { localChain } from "@/constants/chains";
import { MARKET_ABI } from "@/lib/contracts/abis";
import { useMarkets } from "./useMarkets";
import type { Market } from "@/types";

/**
 * The `offers` table (and the Offer.market_address field the backend
 * returns) is keyed by the per-market OfferBook clone's address, not the
 * Market contract's own address - see useOfferBookAddress in useOffers.ts
 * for the full explanation. Any UI that needs to show an offer's asset
 * symbol/decimals or link back to its market has to reverse this mapping.
 *
 * Resolves every active market's OfferBook address in parallel and returns
 * a lowercased-address -> Market lookup.
 */
export function useOfferBookMarketMap() {
  const { data: markets, isLoading: marketsLoading } = useMarkets({ is_active: true });
  const marketList = markets?.markets ?? [];

  const results = useQueries({
    queries: marketList.map((m) => ({
      queryKey: ["offerBookAddress", m.address],
      queryFn: async () =>
        (await readContract(wagmiConfig, {
          address: m.address as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "offerBook",
          chainId: localChain.id,
        })) as `0x${string}`,
      enabled: !!m.address,
      staleTime: Infinity,
    })),
  });

  const map: Record<string, Market> = {};
  marketList.forEach((m, i) => {
    const offerBookAddr = results[i]?.data;
    if (offerBookAddr) map[offerBookAddr.toLowerCase()] = m;
  });

  return {
    map,
    isLoading: marketsLoading || results.some((r) => r.isLoading),
  };
}
