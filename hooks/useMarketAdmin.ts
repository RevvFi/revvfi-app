import { useMutation } from '@tanstack/react-query';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { localChain } from '@/constants/chains';
import { Address } from 'viem';
import { toast } from 'sonner';
import { wagmiConfig } from '@/providers/wagmi-config';
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

const MARKET_ABI = [
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_guardian", "type": "address"}],
    "name": "setGuardian",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endLiquidation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isLiquidating",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "guardian",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * Pause a market (owner only)
 */
export function usePauseMarket() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress }: { marketAddress: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'pause',
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Market paused successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to pause market: ${error.message}`);
    },
  });
}

/**
 * Unpause a market (owner only)
 */
export function useUnpauseMarket() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress }: { marketAddress: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'unpause',
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Market unpaused successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unpause market: ${error.message}`);
    },
  });
}

/**
 * Set market guardian (owner only)
 */
export function useSetGuardian() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress, guardianAddress }: { marketAddress: Address; guardianAddress: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'setGuardian',
        args: [guardianAddress],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Guardian updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to set guardian: ${error.message}`);
    },
  });
}

/**
 * End liquidation mode (owner only)
 */
export function useEndLiquidation() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress }: { marketAddress: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'endLiquidation',
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Liquidation ended successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to end liquidation: ${error.message}`);
    },
  });
}

/**
 * Get market status (paused, liquidating, guardian)
 */
export function useMarketStatus(marketAddress: Address | undefined) {
  const { data: isPaused } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'paused',
    query: {
      enabled: !!marketAddress,
    },
    chainId: localChain.id,
  });

  const { data: isLiquidating } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'isLiquidating',
    query: {
      enabled: !!marketAddress,
    },
    chainId: localChain.id,
  });

  const { data: guardian } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'guardian',
    query: {
      enabled: !!marketAddress,
    },
    chainId: localChain.id,
  });

  return {
    isPaused: isPaused || false,
    isLiquidating: isLiquidating || false,
    guardian: guardian as Address | undefined,
  };
}
