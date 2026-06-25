"use client";

import { useQueries } from '@tanstack/react-query';
import { type Address } from 'viem';
import { useMyMarkets } from './useMarkets';
import { usePositions } from './usePositions';
import { useOffers } from './useOffers';

/**
 * Comprehensive borrower portfolio data
 * Fetches all markets where user is borrower + real-time blockchain data
 */
export function useMyBorrowerPortfolio(address: Address | undefined) {
  // Get all markets where I'm the borrower
  const { data: marketsData, isLoading: marketsLoading } = useMyMarkets(address);

  // For each market, fetch real-time blockchain data
  const marketQueries = useQueries({
    queries: (marketsData?.markets || []).map((market) => ({
      queryKey: ['borrowerMarketData', market.address],
      queryFn: async () => {
        // Note: These hooks would need to be called differently
        // For now, return the market data, we'll enrich in the component
        return market;
      },
      enabled: !!address && !!marketsData,
    })),
  });

  const markets = marketsData?.markets || [];
  const isLoading = marketsLoading || marketQueries.some(q => q.isLoading);

  return {
    markets,
    marketsCount: markets.length,
    isLoading,
    isError: marketQueries.some(q => q.isError),
  };
}

/**
 * Comprehensive lender portfolio data
 * Fetches all positions + offers with real-time values
 */
export function useMyLenderPortfolio(address: string | undefined) {
  // Get all my positions
  const { data: positionsData, isLoading: positionsLoading } = usePositions({
    lender: address,
  });

  // Get all my offers
  const { data: offersData, isLoading: offersLoading } = useOffers({
    lender: address,
  });

  const positions = positionsData?.positions || [];
  const offers = offersData?.offers || [];

  // Calculate totals
  const totalPositionsValue = positions.reduce((sum: number, pos: any) => {
    return sum + parseFloat(pos.principal || '0');
  }, 0);

  const totalClaimable = positions.reduce((sum: number, pos: any) => {
    return sum + parseFloat(pos.claimable_amount || '0');
  }, 0);

  const totalEarned = positions.reduce((sum: number, pos: any) => {
    return sum + parseFloat(pos.accrued_interest || '0');
  }, 0);

  const totalOfferAmount = offers.reduce((sum: number, offer: any) => {
    return sum + parseFloat(offer.amount || '0');
  }, 0);

  // Group by market
  const byMarket: Record<string, {
    positions: typeof positions;
    offers: typeof offers;
    totalLent: number;
    totalEarned: number;
  }> = {};

  positions.forEach((pos: any) => {
    if (!byMarket[pos.market_address]) {
      byMarket[pos.market_address] = {
        positions: [],
        offers: [],
        totalLent: 0,
        totalEarned: 0,
      };
    }
    byMarket[pos.market_address].positions.push(pos);
    byMarket[pos.market_address].totalLent += parseFloat(pos.principal || '0');
    byMarket[pos.market_address].totalEarned += parseFloat(pos.accrued_interest || '0');
  });

  offers.forEach((offer: any) => {
    if (!byMarket[offer.market_address]) {
      byMarket[offer.market_address] = {
        positions: [],
        offers: [],
        totalLent: 0,
        totalEarned: 0,
      };
    }
    byMarket[offer.market_address].offers.push(offer);
  });

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
    isLoading: positionsLoading || offersLoading,
  };
}

/**
 * Complete portfolio overview combining borrower + lender data
 */
export function useCompletePortfolio(address: Address | undefined) {
  const borrowerData = useMyBorrowerPortfolio(address);
  const lenderData = useMyLenderPortfolio(address as string);

  return {
    borrower: borrowerData,
    lender: lenderData,
    isLoading: borrowerData.isLoading || lenderData.isLoading,

    // Combined metrics
    totalValue: lenderData.totalPositionsValue + lenderData.totalOfferAmount,
    totalMarketsCount: borrowerData.marketsCount + lenderData.marketsCount,

    // Role indicators
    isBorrower: borrowerData.marketsCount > 0,
    isLender: lenderData.positionsCount > 0 || lenderData.offersCount > 0,
  };
}
