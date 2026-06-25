"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { toast } from 'sonner';
import { wagmiConfig } from '@/providers/wagmi-config';

const POSITION_NFT_ABI = [
  {
    inputs: [{ internalType: "address", name: "market", type: "address" }],
    name: "registerMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "market", type: "address" }],
    name: "unregisterMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "baseURI", type: "string" }],
    name: "setBaseURI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
] as const;

const POSITION_NFT_ADDRESS = process.env.NEXT_PUBLIC_POSITION_NFT_ADDRESS as Address;

/**
 * Admin hooks for PositionNFT contract management
 * All functions are onlyFactory - must be called by factory owner
 */

export interface RegisterMarketParams {
  marketAddress: Address;
}

/**
 * Register a market to allow it to mint position NFTs
 */
export function useRegisterMarket() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ marketAddress }: RegisterMarketParams) => {
      const txHash = await writeContractAsync({
        address: POSITION_NFT_ADDRESS,
        abi: POSITION_NFT_ABI,
        functionName: 'registerMarket',
        args: [marketAddress],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('Market registered successfully');
    },
    onError: (error: Error) => {
      console.error('Register market failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else if (error.message?.includes('MarketAlreadyRegistered')) {
        toast.error('Market is already registered');
      } else if (error.message?.includes('UnauthorizedCaller')) {
        toast.error('Only factory owner can register markets');
      } else {
        toast.error(`Failed to register market: ${error.message}`);
      }
    },
  });
}

/**
 * Unregister a market to prevent it from minting new position NFTs
 */
export function useUnregisterMarket() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ marketAddress }: RegisterMarketParams) => {
      const txHash = await writeContractAsync({
        address: POSITION_NFT_ADDRESS,
        abi: POSITION_NFT_ABI,
        functionName: 'unregisterMarket',
        args: [marketAddress],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('Market unregistered successfully');
    },
    onError: (error: Error) => {
      console.error('Unregister market failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else if (error.message?.includes('MarketNotRegistered')) {
        toast.error('Market is not registered');
      } else if (error.message?.includes('UnauthorizedCaller')) {
        toast.error('Only factory owner can unregister markets');
      } else {
        toast.error(`Failed to unregister market: ${error.message}`);
      }
    },
  });
}

export interface SetBaseURIParams {
  baseURI: string;
}

/**
 * Set the base URI for position NFT metadata
 * This is used for displaying NFT images and metadata
 */
export function useSetBaseURI() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useMutation({
    mutationFn: async ({ baseURI }: SetBaseURIParams) => {
      const txHash = await writeContractAsync({
        address: POSITION_NFT_ADDRESS,
        abi: POSITION_NFT_ABI,
        functionName: 'setBaseURI',
        args: [baseURI],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Base URI updated successfully');
    },
    onError: (error: Error) => {
      console.error('Set base URI failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else if (error.message?.includes('UnauthorizedCaller')) {
        toast.error('Only factory owner can set base URI');
      } else {
        toast.error(`Failed to set base URI: ${error.message}`);
      }
    },
  });
}
