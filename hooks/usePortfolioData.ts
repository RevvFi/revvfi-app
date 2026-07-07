"use client";

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { formatUnits, type Address } from 'viem';
import { useMyMarkets, useMarkets } from './useMarkets';
import { usePositions } from './usePositions';
import { useOffers } from './useOffers';
import { useOfferBookMarketMap } from './useOfferBookMarketMap';
import type { Market } from '@/types';

export function useMyBorrowerPortfolio(address: Address | undefined) {
  const { data: marketsData, isLoading: marketsLoading } = useMyMarkets(address);

  const marketQueries = useQueries({
    queries: (marketsData?.markets || []).map((market) => ({
      queryKey: ['borrowerMarketData', market.address],
      queryFn: async () => {
        return market;
      },
      enabled: !!address && !!marketsData,
    })),
  });

  const markets = marketsData?.markets || [];
  const isLoading = marketsLoading || marketQueries.some(q => q.isLoading);

  // Each market already reports its own total_principal/total_debt in its own
  // borrow_asset's decimals, so summing per symbol (rather than the backend's
  // single blended borrower.total_borrowed/total_repaid fields) gives a
  // correctly-scaled total across markets with different borrow assets.
  const { totalPrincipal, totalDebt } = useMemo(() => {
    const principalBySymbol: Record<string, { amount: number; decimals: number }> = {};
    const debtBySymbol: Record<string, { amount: number; decimals: number }> = {};

    markets.forEach((market) => {
      const decimals = market.borrow_asset.decimals;
      const symbol = market.borrow_asset.symbol;
      principalBySymbol[symbol] = {
        decimals,
        amount: (principalBySymbol[symbol]?.amount ?? 0) + toHuman(market.total_principal, decimals),
      };
      debtBySymbol[symbol] = {
        decimals,
        amount: (debtBySymbol[symbol]?.amount ?? 0) + toHuman(market.total_debt, decimals),
      };
    });

    return {
      totalPrincipal: toAssetAmounts(principalBySymbol),
      totalDebt: toAssetAmounts(debtBySymbol),
    };
  }, [markets]);

  return {
    markets,
    marketsCount: markets.length,
    totalPrincipal,
    totalDebt,
    isLoading,
    isError: marketQueries.some(q => q.isError),
  };
}

function toHuman(raw: string | undefined, decimals: number | undefined): number {
  if (!raw || raw === '0') return 0;
  try {
    return Number(formatUnits(BigInt(raw), decimals ?? 6));
  } catch {
    return 0;
  }
}

export interface AssetAmount {
  symbol: string;
  decimals: number;
  amount: number;
}

function toAssetAmounts(bySymbol: Record<string, { amount: number; decimals: number }>): AssetAmount[] {
  return Object.entries(bySymbol)
    .filter(([, v]) => v.amount !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, v]) => ({ symbol, decimals: v.decimals, amount: v.amount }));
}

export function useMyLenderPortfolio(address: string | undefined) {
  const { data: positionsData, isLoading: positionsLoading } = usePositions({
    lender: address,
  });

  const { data: offersData, isLoading: offersLoading } = useOffers({
    lender: address,
  });

  const { data: marketsData, isLoading: marketsLoading } = useMarkets({ is_active: true });
  // offer.market_address is the OfferBook clone's address, not the market's -
  // this reverse lookup resolves it back to the market.
  const { map: offerBookMarketMap, isLoading: offerBookMapLoading } = useOfferBookMarketMap();

  const positions = positionsData?.positions || [];
  const offers = offersData?.offers || [];

  const marketByAddress = useMemo(() => {
    const map: Record<string, Market> = {};
    (marketsData?.markets ?? []).forEach((m: Market) => {
      map[m.address.toLowerCase()] = m;
    });
    return map;
  }, [marketsData]);

  const { totalPositionsValue, totalClaimable, totalEarned, totalOfferAmount, byMarket } = useMemo(() => {
    const valueBySymbol: Record<string, { amount: number; decimals: number }> = {};
    const claimableBySymbol: Record<string, { amount: number; decimals: number }> = {};
    const earnedBySymbol: Record<string, { amount: number; decimals: number }> = {};
    const offerBySymbol: Record<string, { amount: number; decimals: number }> = {};

    const byMarket: Record<string, {
      positions: typeof positions;
      offers: typeof offers;
      totalLent: number;
      totalEarned: number;
      symbol: string;
      decimals: number;
    }> = {};

    positions.forEach((pos: any) => {
      const market = marketByAddress[(pos.market_address || '').toLowerCase()];
      const decimals = market?.borrow_asset.decimals ?? 6;
      const symbol = market?.borrow_asset.symbol ?? '?';

      const principal = toHuman(pos.principal, decimals);
      const claimable = toHuman(pos.claimable_amount, decimals);
      const earned = toHuman(pos.accrued_interest, decimals);

      valueBySymbol[symbol] = { decimals, amount: (valueBySymbol[symbol]?.amount ?? 0) + principal };
      claimableBySymbol[symbol] = { decimals, amount: (claimableBySymbol[symbol]?.amount ?? 0) + claimable };
      earnedBySymbol[symbol] = { decimals, amount: (earnedBySymbol[symbol]?.amount ?? 0) + earned };

      const key = (pos.market_address || '').toLowerCase();
      if (!byMarket[key]) {
        byMarket[key] = { positions: [], offers: [], totalLent: 0, totalEarned: 0, symbol, decimals };
      }
      byMarket[key].positions.push(pos);
      byMarket[key].totalLent += principal;
      byMarket[key].totalEarned += earned;
    });

    offers.forEach((offer: any) => {
      const market = offerBookMarketMap[(offer.market_address || '').toLowerCase()];
      const decimals = market?.borrow_asset.decimals ?? 6;
      const symbol = market?.borrow_asset.symbol ?? '?';

      const amount = toHuman(offer.amount, decimals);
      offerBySymbol[symbol] = { decimals, amount: (offerBySymbol[symbol]?.amount ?? 0) + amount };

      const key = market ? market.address.toLowerCase() : (offer.market_address || '').toLowerCase();
      if (!byMarket[key]) {
        byMarket[key] = { positions: [], offers: [], totalLent: 0, totalEarned: 0, symbol, decimals };
      }
      byMarket[key].offers.push(offer);
    });

    return {
      totalPositionsValue: toAssetAmounts(valueBySymbol),
      totalClaimable: toAssetAmounts(claimableBySymbol),
      totalEarned: toAssetAmounts(earnedBySymbol),
      totalOfferAmount: toAssetAmounts(offerBySymbol),
      byMarket,
    };
  }, [positions, offers, marketByAddress, offerBookMarketMap]);

  return {
    positions,
    offers,
    positionsCount: positions.length,
    offersCount: offers.length,
    totalPositionsValue,
    totalClaimable,
    totalEarned,
    totalOfferAmount,
    byMarket,
    marketsCount: Object.keys(byMarket).length,
    isLoading: positionsLoading || offersLoading || marketsLoading || offerBookMapLoading,
    marketByAddress,
    offerBookMarketMap,
  };
}

export function useCompletePortfolio(address: Address | undefined) {
  const borrowerData = useMyBorrowerPortfolio(address);
  const lenderData = useMyLenderPortfolio(address as string);

  return {
    borrower: borrowerData,
    lender: lenderData,
    isLoading: borrowerData.isLoading || lenderData.isLoading,
    totalMarketsCount: borrowerData.marketsCount + lenderData.marketsCount,
    isBorrower: borrowerData.marketsCount > 0,
    isLender: lenderData.positionsCount > 0 || lenderData.offersCount > 0,
  };
}
