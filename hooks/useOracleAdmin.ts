import { useMutation } from '@tanstack/react-query';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { toast } from 'sonner';
import { wagmiConfig } from '@/providers/wagmi-config';

const ORACLE_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "newPrice", "type": "uint256"}],
    "name": "setLatestPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {"internalType": "uint80", "name": "roundId", "type": "uint80"},
      {"internalType": "int256", "name": "answer", "type": "int256"},
      {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
      {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
      {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * Set oracle price (MockOracle only - for testing)
 */
export function useSetOraclePrice() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });

  return useMutation({
    mutationFn: async ({ oracleAddress, price }: { oracleAddress: Address; price: string }) => {
      // Convert price to proper format (assuming 8 decimals for most oracles)
      const priceWei = BigInt(Math.floor(parseFloat(price) * 1e8));

      const txHash = await writeContractAsync({
        address: oracleAddress,
        abi: ORACLE_ABI,
        functionName: 'setLatestPrice',
        args: [priceWei],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Oracle price updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update oracle price: ${error.message}`);
    },
  });
}

/**
 * Get current oracle price
 */
export function useOraclePrice(oracleAddress: Address | undefined) {
  const { data: latestRoundData } = useReadContract({
    address: oracleAddress,
    abi: ORACLE_ABI,
    functionName: 'latestRoundData',
    query: {
      enabled: !!oracleAddress,
    }
  });

  const { data: decimals } = useReadContract({
    address: oracleAddress,
    abi: ORACLE_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!oracleAddress,
    }
  });

  const price = latestRoundData ? Number(latestRoundData[1]) / Math.pow(10, decimals || 8) : 0;
  const updatedAt = latestRoundData ? Number(latestRoundData[3]) : 0;

  return {
    price,
    decimals: decimals || 8,
    updatedAt,
    isStale: updatedAt > 0 && Date.now() / 1000 - updatedAt > 3600, // Stale if > 1 hour old
  };
}
