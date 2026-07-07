"use client";

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { type Address, parseUnits } from 'viem';
import { wagmiConfig } from '@/providers/wagmi-config';
import { localChain } from '@/constants/chains';
import { MARKET_ABI, OFFER_BOOK_ABI } from '@/lib/contracts/abis';
import { readContract } from '@wagmi/core';

/**
 * Hooks for reading OfferBook contract view functions
 * These provide real-time on-chain data for available liquidity and offers
 */

/**
 * Get a single offer by ID
 */
export function useOffer(marketAddress: Address | undefined, offerId: number | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['offerBook', 'offer', marketAddress, offerId],
    queryFn: async () => {
      if (!marketAddress || offerId === undefined) return null;

      // Get OfferBook address from Market
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'offerBook',
        chainId: localChain.id,
      })) as Address;

      const result = await publicClient!.readContract({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: 'getOffer',
        args: [BigInt(offerId)],
      });

      return result as any;
    },
    enabled: !!marketAddress && offerId !== undefined,
    refetchInterval: 30_000,
  });
}

/**
 * Get all offers by a specific lender
 */
export function useLenderOffers(marketAddress: Address | undefined, lenderAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['offerBook', 'lenderOffers', marketAddress, lenderAddress],
    queryFn: async () => {
      if (!marketAddress || !lenderAddress) return [];

      // Get OfferBook address from Market
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'offerBook',
        chainId: localChain.id,
      })) as Address;

      const result = await publicClient!.readContract({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: 'getLenderOffers',
        args: [lenderAddress],
      });

      return result as any[];
    },
    enabled: !!marketAddress && !!lenderAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get total liquidity available across all active offers
 */
export function useTotalLiquidityAvailable(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['offerBook', 'totalLiquidity', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);

      // Get OfferBook address from Market
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'offerBook',
        chainId: localChain.id,
      })) as Address;

      const result = await publicClient!.readContract({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: 'getTotalLiquidityAvailable',
      });

      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 15_000, // More frequent for liquidity monitoring
  });
}

/**
 * Get count of active offers in the offer book
 */
export function useActiveOfferCount(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['offerBook', 'activeOfferCount', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);

      // Get OfferBook address from Market
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'offerBook',
        chainId: localChain.id,
      })) as Address;

      const result = await publicClient!.readContract({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: 'getActiveOfferCount',
      });

      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get best offers that would be matched for a borrow amount (PREVIEW)
 * This calls the same function that executeDrawdown uses internally
 * So the preview will match exactly what happens when borrowing
 */
export function useBestOffers(
  marketAddress: Address | undefined,
  amount: string,
  borrowAssetDecimals: number,
  useSeniorOnly: boolean
) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['offerBook', 'bestOffers', marketAddress, amount, useSeniorOnly],
    queryFn: async () => {
      if (!marketAddress || !amount || parseFloat(amount) <= 0) {
        return null;
      }

      // Get OfferBook address from Market
      const offerBookAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'offerBook',
        chainId: localChain.id,
      })) as Address;

      // Parse amount to wei
      const amountWei = parseUnits(amount, borrowAssetDecimals);

      // Call getBestOffers - this is a VIEW function (no signature needed)
      const result = await publicClient!.readContract({
        address: offerBookAddr,
        abi: OFFER_BOOK_ABI,
        functionName: 'getBestOffers',
        args: [amountWei, useSeniorOnly],
      }) as [any[], bigint, bigint];

      return {
        offers: result[0] as any[], // Array of Offer structs that will be matched
        totalAvailable: result[1] as bigint, // Total liquidity available
        weightedApr: result[2] as bigint, // Weighted APR in basis points
      };
    },
    enabled: !!marketAddress && !!amount && parseFloat(amount) > 0,
    refetchInterval: 15_000, // Refresh every 15 seconds for real-time accuracy
    retry: false, // Don't retry on error (might be insufficient liquidity)
  });
}

/**
 * Composite hook for offer book stats
 * Useful for lender dashboard
 */
export function useOfferBookStats(marketAddress: Address | undefined) {
  const totalLiquidity = useTotalLiquidityAvailable(marketAddress);
  const activeOfferCount = useActiveOfferCount(marketAddress);

  return {
    totalLiquidity: totalLiquidity.data,
    activeOfferCount: activeOfferCount.data,
    isLoading: totalLiquidity.isLoading || activeOfferCount.isLoading,
    isError: totalLiquidity.isError || activeOfferCount.isError,
  };
}
