"use client";

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { wagmiConfig } from '@/providers/wagmi-config';
import { MARKET_ABI, LIQUIDITY_QUEUE_ABI } from '@/lib/contracts/abis';
import { readContract } from '@wagmi/core';

/**
 * Hooks for reading LiquidityQueue contract view functions
 * These provide real-time on-chain data for withdrawal requests and epochs
 */

/**
 * Get current epoch number
 */
export function useCurrentEpoch(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useQuery({
    queryKey: ['liquidityQueue', 'currentEpoch', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);

      // Get LiquidityQueue address from Market
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'liquidityQueue',
      })) as Address;

      const result = await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: 'getCurrentEpoch',
      });

      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get epoch details by epoch number
 */
export function useEpoch(marketAddress: Address | undefined, epochNumber: number | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useQuery({
    queryKey: ['liquidityQueue', 'epoch', marketAddress, epochNumber],
    queryFn: async () => {
      if (!marketAddress || epochNumber === undefined) return null;

      // Get LiquidityQueue address from Market
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'liquidityQueue',
      })) as Address;

      const result = await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: 'getEpoch',
        args: [BigInt(epochNumber)],
      });

      return result as any;
    },
    enabled: !!marketAddress && epochNumber !== undefined,
    refetchInterval: 30_000,
  });
}

/**
 * Get withdrawal request details by request ID
 */
export function useWithdrawalRequest(marketAddress: Address | undefined, requestId: number | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useQuery({
    queryKey: ['liquidityQueue', 'withdrawalRequest', marketAddress, requestId],
    queryFn: async () => {
      if (!marketAddress || requestId === undefined) return null;

      // Get LiquidityQueue address from Market
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'liquidityQueue',
      })) as Address;

      const result = await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: 'getWithdrawalRequest',
        args: [BigInt(requestId)],
      });

      return result as any;
    },
    enabled: !!marketAddress && requestId !== undefined,
    refetchInterval: 30_000,
  });
}

/**
 * Get all withdrawal request IDs for a lender
 */
export function useLenderRequests(marketAddress: Address | undefined, lenderAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useQuery({
    queryKey: ['liquidityQueue', 'lenderRequests', marketAddress, lenderAddress],
    queryFn: async () => {
      if (!marketAddress || !lenderAddress) return [];

      // Get LiquidityQueue address from Market
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'liquidityQueue',
      })) as Address;

      const result = await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: 'getLenderRequests',
        args: [lenderAddress],
      });

      return result as bigint[];
    },
    enabled: !!marketAddress && !!lenderAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get all withdrawal request IDs in a specific epoch
 */
export function useEpochRequests(marketAddress: Address | undefined, epochNumber: number | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useQuery({
    queryKey: ['liquidityQueue', 'epochRequests', marketAddress, epochNumber],
    queryFn: async () => {
      if (!marketAddress || epochNumber === undefined) return [];

      // Get LiquidityQueue address from Market
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'liquidityQueue',
      })) as Address;

      const result = await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: 'getEpochRequests',
        args: [BigInt(epochNumber)],
      });

      return result as bigint[];
    },
    enabled: !!marketAddress && epochNumber !== undefined,
    refetchInterval: 30_000,
  });
}

/**
 * Check if a withdrawal request is ready to be claimed
 */
export function useIsWithdrawalReady(marketAddress: Address | undefined, requestId: number | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useQuery({
    queryKey: ['liquidityQueue', 'isWithdrawalReady', marketAddress, requestId],
    queryFn: async () => {
      if (!marketAddress || requestId === undefined) return false;

      // Get LiquidityQueue address from Market
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'liquidityQueue',
      })) as Address;

      const result = await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: 'isWithdrawalReady',
        args: [BigInt(requestId)],
      });

      return result as boolean;
    },
    enabled: !!marketAddress && requestId !== undefined,
    refetchInterval: 30_000,
  });
}

/**
 * Get time remaining until current epoch ends (in seconds)
 */
export function useTimeUntilEpochEnd(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useQuery({
    queryKey: ['liquidityQueue', 'timeUntilEpochEnd', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);

      // Get LiquidityQueue address from Market
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'liquidityQueue',
      })) as Address;

      const result = await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: 'timeUntilEpochEnd',
      });

      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 60_000, // Refresh every minute for countdown
  });
}

/**
 * Composite hook for withdrawal request status
 * Useful for showing withdrawal progress to users
 */
export function useWithdrawalStatus(marketAddress: Address | undefined, requestId: number | undefined) {
  const request = useWithdrawalRequest(marketAddress, requestId);
  const isReady = useIsWithdrawalReady(marketAddress, requestId);

  return {
    request: request.data,
    isReady: isReady.data,
    isLoading: request.isLoading || isReady.isLoading,
    isError: request.isError || isReady.isError,
  };
}

/**
 * Composite hook for current epoch status
 * Useful for showing epoch progress to admins
 */
export function useCurrentEpochStatus(marketAddress: Address | undefined) {
  const currentEpochNum = useCurrentEpoch(marketAddress);
  const epochDetails = useEpoch(marketAddress, Number(currentEpochNum.data || 0));
  const timeRemaining = useTimeUntilEpochEnd(marketAddress);

  return {
    epochNumber: currentEpochNum.data,
    epochDetails: epochDetails.data,
    timeRemaining: timeRemaining.data,
    isLoading: currentEpochNum.isLoading || epochDetails.isLoading,
    isError: currentEpochNum.isError || epochDetails.isError,
  };
}
