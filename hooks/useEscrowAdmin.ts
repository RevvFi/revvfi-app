import { useMutation } from '@tanstack/react-query';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { toast } from 'sonner';
import { wagmiConfig } from '@/providers/wagmi-config';

const ESCROW_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_minCollateralRatio", "type": "uint256"}],
    "name": "setMinCollateralRatio",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_liquidationThreshold", "type": "uint256"}],
    "name": "setLiquidationThreshold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minCollateralRatio",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidationThreshold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * Set minimum collateral ratio (owner only)
 */
export function useSetMinCollateralRatio() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useMutation({
    mutationFn: async ({ escrowAddress, ratioBps }: { escrowAddress: Address; ratioBps: number }) => {
      const txHash = await writeContractAsync({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: 'setMinCollateralRatio',
        args: [BigInt(ratioBps)],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Min collateral ratio updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update min collateral ratio: ${error.message}`);
    },
  });
}

/**
 * Set liquidation threshold (owner only)
 */
export function useSetLiquidationThreshold() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useMutation({
    mutationFn: async ({ escrowAddress, thresholdBps }: { escrowAddress: Address; thresholdBps: number }) => {
      const txHash = await writeContractAsync({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: 'setLiquidationThreshold',
        args: [BigInt(thresholdBps)],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Liquidation threshold updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update liquidation threshold: ${error.message}`);
    },
  });
}

/**
 * Get collateral parameters for an escrow
 */
export function useCollateralParams(escrowAddress: Address | undefined) {
  const { data: minCollateralRatio } = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: 'minCollateralRatio',
    query: {
      enabled: !!escrowAddress,
    }
  });

  const { data: liquidationThreshold } = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: 'liquidationThreshold',
    query: {
      enabled: !!escrowAddress,
    }
  });

  return {
    minCollateralRatio: minCollateralRatio ? Number(minCollateralRatio) : 0,
    liquidationThreshold: liquidationThreshold ? Number(liquidationThreshold) : 0,
  };
}
