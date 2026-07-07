import { useMutation } from '@tanstack/react-query';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { localChain } from '@/constants/chains';
import { Address } from 'viem';
import { toast } from 'sonner';
import { wagmiConfig } from '@/providers/wagmi-config';
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

const LIQUIDATOR_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "newDuration", "type": "uint256"}],
    "name": "setAuctionDuration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "newIncrementBps", "type": "uint256"}],
    "name": "setMinBidIncrementBps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "newWindow", "type": "uint256"}],
    "name": "setAuctionExtensionWindow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "stepDuration", "type": "uint256"},
      {"internalType": "uint256", "name": "decrementBps", "type": "uint256"}
    ],
    "name": "setDutchAuctionParams",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "auctionId", "type": "uint256"}],
    "name": "cancelAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "auctionDuration",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBidIncrementBps",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "auctionExtensionWindow",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dutchAuctionStepDuration",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dutchAuctionPriceDecrementBps",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * Set auction duration (factory owner only)
 */
export function useSetAuctionDuration(liquidatorAddress: Address) {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ durationSeconds }: { durationSeconds: number }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: liquidatorAddress,
        abi: LIQUIDATOR_ABI,
        functionName: 'setAuctionDuration',
        args: [BigInt(durationSeconds)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Auction duration updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update auction duration: ${error.message}`);
    },
  });
}

/**
 * Set minimum bid increment (factory owner only)
 */
export function useSetMinBidIncrementBps(liquidatorAddress: Address) {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ incrementBps }: { incrementBps: number }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: liquidatorAddress,
        abi: LIQUIDATOR_ABI,
        functionName: 'setMinBidIncrementBps',
        args: [BigInt(incrementBps)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Min bid increment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update min bid increment: ${error.message}`);
    },
  });
}

/**
 * Set auction extension window (factory owner only)
 */
export function useSetAuctionExtensionWindow(liquidatorAddress: Address) {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ windowSeconds }: { windowSeconds: number }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: liquidatorAddress,
        abi: LIQUIDATOR_ABI,
        functionName: 'setAuctionExtensionWindow',
        args: [BigInt(windowSeconds)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Auction extension window updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update extension window: ${error.message}`);
    },
  });
}

/**
 * Set Dutch auction parameters (factory owner only)
 */
export function useSetDutchAuctionParams(liquidatorAddress: Address) {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ stepDurationSeconds, decrementBps }: { stepDurationSeconds: number; decrementBps: number }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: liquidatorAddress,
        abi: LIQUIDATOR_ABI,
        functionName: 'setDutchAuctionParams',
        args: [BigInt(stepDurationSeconds), BigInt(decrementBps)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Dutch auction parameters updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update Dutch auction params: ${error.message}`);
    },
  });
}

/**
 * Cancel an auction (factory owner only)
 */
export function useCancelAuction(liquidatorAddress: Address) {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ auctionId }: { auctionId: number }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: liquidatorAddress,
        abi: LIQUIDATOR_ABI,
        functionName: 'cancelAuction',
        args: [BigInt(auctionId)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Auction cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel auction: ${error.message}`);
    },
  });
}

/**
 * Get current auction parameters
 */
export function useAuctionParams(liquidatorAddress: Address | undefined) {
  const { data: auctionDuration } = useReadContract({
    address: liquidatorAddress,
    abi: LIQUIDATOR_ABI,
    functionName: 'auctionDuration',
    query: {
      enabled: !!liquidatorAddress,
    },
    chainId: localChain.id,
  });

  const { data: minBidIncrementBps } = useReadContract({
    address: liquidatorAddress,
    abi: LIQUIDATOR_ABI,
    functionName: 'minBidIncrementBps',
    query: {
      enabled: !!liquidatorAddress,
    },
    chainId: localChain.id,
  });

  const { data: auctionExtensionWindow } = useReadContract({
    address: liquidatorAddress,
    abi: LIQUIDATOR_ABI,
    functionName: 'auctionExtensionWindow',
    query: {
      enabled: !!liquidatorAddress,
    },
    chainId: localChain.id,
  });

  const { data: dutchAuctionStepDuration } = useReadContract({
    address: liquidatorAddress,
    abi: LIQUIDATOR_ABI,
    functionName: 'dutchAuctionStepDuration',
    query: {
      enabled: !!liquidatorAddress,
    },
    chainId: localChain.id,
  });

  const { data: dutchAuctionPriceDecrementBps } = useReadContract({
    address: liquidatorAddress,
    abi: LIQUIDATOR_ABI,
    functionName: 'dutchAuctionPriceDecrementBps',
    query: {
      enabled: !!liquidatorAddress,
    },
    chainId: localChain.id,
  });

  return {
    auctionDuration: auctionDuration ? Number(auctionDuration) : 0,
    minBidIncrementBps: minBidIncrementBps ? Number(minBidIncrementBps) : 0,
    auctionExtensionWindow: auctionExtensionWindow ? Number(auctionExtensionWindow) : 0,
    dutchAuctionStepDuration: dutchAuctionStepDuration ? Number(dutchAuctionStepDuration) : 0,
    dutchAuctionPriceDecrementBps: dutchAuctionPriceDecrementBps ? Number(dutchAuctionPriceDecrementBps) : 0,
  };
}
