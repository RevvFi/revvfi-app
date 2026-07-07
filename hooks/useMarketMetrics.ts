"use client";

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { localChain } from '@/constants/chains';
import { type Address } from 'viem';
import { wagmiConfig } from '@/providers/wagmi-config';
import { MARKET_ABI } from '@/lib/contracts/abis';

/**
 * Hooks for reading Market contract view functions
 * These provide real-time on-chain data for market health and metrics
 */

/**
 * Get total debt owed by borrower (principal + accrued interest)
 */
export function useTotalOwed(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'totalOwed', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getTotalOwed',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000, // Refresh every 30 seconds
  });
}

/**
 * Get current principal (without accrued interest)
 */
export function useCurrentPrincipal(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'currentPrincipal', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getCurrentPrincipal',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get total collateral value
 */
export function useTotalAssets(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'totalAssets', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'totalAssets',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get current collateral ratio (in basis points)
 * Returns ratio * 10000 (e.g., 15000 = 150% collateralization)
 */
export function useCollateralRatio(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'collateralRatio', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getCollateralRatio',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 15_000, // More frequent for health monitoring
  });
}

/**
 * Check if market position is healthy (above liquidation threshold)
 */
export function useIsHealthy(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'isHealthy', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return false;
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'isHealthy',
      });
      return result as boolean;
    },
    enabled: !!marketAddress,
    refetchInterval: 15_000,
  });
}

/**
 * Check if market position can be liquidated
 */
export function useIsLiquidatable(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'isLiquidatable', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return false;
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'isLiquidatable',
      });
      return result as boolean;
    },
    enabled: !!marketAddress,
    refetchInterval: 15_000,
  });
}

/**
 * Get maximum amount borrower can borrow given current collateral
 */
export function useMaxBorrowable(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'maxBorrowable', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getMaxBorrowable',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get claimable amount for a specific position
 */
export function usePositionClaimable(marketAddress: Address | undefined, positionId: number | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'positionClaimable', marketAddress, positionId],
    queryFn: async () => {
      if (!marketAddress || positionId === undefined) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getPositionClaimable',
        args: [BigInt(positionId)],
      });
      return result as bigint;
    },
    enabled: !!marketAddress && positionId !== undefined,
    refetchInterval: 30_000,
  });
}

/**
 * Get current value of a position (principal + accrued interest)
 */
export function usePositionValue(marketAddress: Address | undefined, positionId: number | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'positionValue', marketAddress, positionId],
    queryFn: async () => {
      if (!marketAddress || positionId === undefined) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getPositionValue',
        args: [BigInt(positionId)],
      });
      return result as bigint;
    },
    enabled: !!marketAddress && positionId !== undefined,
    refetchInterval: 30_000,
  });
}

/**
 * Get count of active positions in the market
 */
export function useActivePositionsCount(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'activePositionsCount', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getActivePositionsCount',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get paginated list of active position IDs
 */
export function useActivePositionsPaginated(
  marketAddress: Address | undefined,
  start: number,
  limit: number
) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'activePositions', marketAddress, start, limit],
    queryFn: async () => {
      if (!marketAddress) return [];
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getActivePositionsPaginated',
        args: [BigInt(start), BigInt(limit)],
      });
      return result as bigint[];
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get total debt in the market
 */
export function useTotalDebt(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'totalDebt', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'totalDebt',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Get current borrow index (compound interest accumulator)
 */
export function useCurrentDebtIndex(marketAddress: Address | undefined) {
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useQuery({
    queryKey: ['market', 'currentDebtIndex', marketAddress],
    queryFn: async () => {
      if (!marketAddress) return BigInt(0);
      const result = await publicClient!.readContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'getCurrentDebtIndex',
      });
      return result as bigint;
    },
    enabled: !!marketAddress,
    refetchInterval: 30_000,
  });
}

/**
 * Composite hook for all key market health metrics
 * Useful for dashboard displays
 */
export function useMarketHealth(marketAddress: Address | undefined) {
  const totalOwed = useTotalOwed(marketAddress);
  const collateralRatio = useCollateralRatio(marketAddress);
  const isHealthy = useIsHealthy(marketAddress);
  const isLiquidatable = useIsLiquidatable(marketAddress);
  const maxBorrowable = useMaxBorrowable(marketAddress);

  return {
    totalOwed: totalOwed.data,
    collateralRatio: collateralRatio.data,
    isHealthy: isHealthy.data,
    isLiquidatable: isLiquidatable.data,
    maxBorrowable: maxBorrowable.data,
    isLoading: totalOwed.isLoading || collateralRatio.isLoading,
    isError: totalOwed.isError || collateralRatio.isError,
  };
}
