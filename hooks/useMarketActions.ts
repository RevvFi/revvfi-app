"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { localChain } from '@/constants/chains';
import { erc20Abi, type Address } from 'viem';
import { toast } from 'sonner';
import { wagmiConfig } from '@/providers/wagmi-config';
import { MARKET_ABI } from '@/lib/contracts/abis';
import { queryKeys } from '@/constants/query-keys';
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

/**
 * Hook for additional market actions (repayFull, closeMarket, forceCloseMarket)
 * These are borrower-only functions for managing market lifecycle
 */

export interface RepayFullParams {
  marketAddress: string;
  borrowAssetAddress: string;
}

/**
 * Repay full outstanding debt including all accrued interest
 * Automatically calculates total amount owed on-chain
 */
export function useRepayFull() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress, borrowAssetAddress }: RepayFullParams) => {
      await ensureLocalChain();
      const marketAddr = marketAddress as Address;
      const tokenAddr = borrowAssetAddress as Address;

      // Step 1: Get total amount owed from Market contract
      toast.info('Calculating total debt...');
      const totalOwed = await publicClient!.readContract({
        address: marketAddr,
        abi: MARKET_ABI,
        functionName: 'getTotalOwed',
      }) as bigint;

      if (totalOwed === BigInt(0)) {
        throw new Error('No debt to repay');
      }

      // Step 2: Approve Market to pull full repayment amount
      toast.info(`Step 1/2: Approving full repayment...`);
      const approveTx = await writeContractAsync({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: 'approve',
        args: [marketAddr, totalOwed],
        chainId: localChain.id,
      });
      const approveReceipt = await publicClient!.waitForTransactionReceipt({ hash: approveTx });
      if (approveReceipt.status !== 'success') throw new Error('Approval transaction failed');

      // Step 3: Call Market.repayFull()
      toast.info('Step 2/2: Repaying full debt...');
      const repayTx = await writeContractAsync({
        address: marketAddr,
        abi: MARKET_ABI,
        functionName: 'repayFull',
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: repayTx });
      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return repayTx;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.borrowers.detail('') });
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      toast.success('Full repayment successful!');
    },
    onError: (e: Error) => {
      console.error('Repay full failed:', e);
      if (e.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else if (e.message?.includes('ZeroAmount')) {
        toast.error('No debt to repay');
      } else if (e.message?.includes('InsufficientBalance')) {
        toast.error('Insufficient balance to repay full amount');
      } else {
        toast.error(e.message || 'Repay full transaction failed');
      }
    },
  });
}

export interface CloseMarketParams {
  marketAddress: string;
}

/**
 * Close market permanently (only when all debt is repaid and no active positions)
 * This is a clean shutdown of the market
 */
export function useCloseMarket() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress }: CloseMarketParams) => {
      await ensureLocalChain();
      toast.info('Closing market...');
      const txHash = await writeContractAsync({
        address: marketAddress as Address,
        abi: MARKET_ABI,
        functionName: 'closeMarket',
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      qc.invalidateQueries({ queryKey: queryKeys.borrowers.detail('') });
      toast.success('Market closed successfully!');
    },
    onError: (e: Error) => {
      console.error('Close market failed:', e);
      if (e.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else if (e.message?.includes('InsufficientRepayment')) {
        toast.error('Cannot close market: Outstanding debt remains');
      } else if (e.message?.includes('TooManyActivePositions')) {
        toast.error('Cannot close market: Active positions still exist');
      } else {
        toast.error(e.message || 'Close market failed');
      }
    },
  });
}

/**
 * Force close market with dust cleanup (when remaining debt is below threshold)
 * WARNING: This writes off any remaining dust debt
 */
export function useForceCloseMarket() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress }: CloseMarketParams) => {
      await ensureLocalChain();
      toast.info('Force closing market...');
      const txHash = await writeContractAsync({
        address: marketAddress as Address,
        abi: MARKET_ABI,
        functionName: 'forceCloseMarket',
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      qc.invalidateQueries({ queryKey: queryKeys.borrowers.detail('') });
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      toast.success('Market force closed successfully!');
    },
    onError: (e: Error) => {
      console.error('Force close market failed:', e);
      if (e.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else if (e.message?.includes('Debt too high')) {
        toast.error('Debt amount too high to force close. Please repay remaining debt.');
      } else {
        toast.error(e.message || 'Force close market failed');
      }
    },
  });
}
