import { useMutation } from '@tanstack/react-query';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { localChain } from '@/constants/chains';
import { Address, parseUnits } from 'viem';
import { toast } from 'sonner';
import { wagmiConfig } from '@/providers/wagmi-config';
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

const LIQUIDATOR_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "auctionId", "type": "uint256"},
      {"internalType": "uint256", "name": "bidAmount", "type": "uint256"}
    ],
    "name": "placeBid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "auctionId", "type": "uint256"}],
    "name": "settleAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "auctionId", "type": "uint256"}],
    "name": "getCurrentPrice",
    "outputs": [{"internalType": "uint256", "name": "currentPrice", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "auctionId", "type": "uint256"}],
    "name": "getAuction",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "id", "type": "uint256"},
        {"internalType": "address", "name": "market", "type": "address"},
        {"internalType": "address", "name": "borrower", "type": "address"},
        {"internalType": "address", "name": "borrowAsset", "type": "address"},
        {"internalType": "address", "name": "collateralAsset", "type": "address"},
        {"internalType": "uint256", "name": "collateralAmount", "type": "uint256"},
        {"internalType": "uint256", "name": "debtAmount", "type": "uint256"},
        {"internalType": "uint256", "name": "reservePrice", "type": "uint256"},
        {"internalType": "uint256", "name": "startTime", "type": "uint256"},
        {"internalType": "uint256", "name": "endTime", "type": "uint256"},
        {"internalType": "uint256", "name": "highestBid", "type": "uint256"},
        {"internalType": "address", "name": "highestBidder", "type": "address"},
        {"internalType": "bool", "name": "active", "type": "bool"},
        {"internalType": "bool", "name": "settled", "type": "bool"},
        {"internalType": "bool", "name": "collateralTransferred", "type": "bool"}
      ],
      "internalType": "struct IRevvFiLiquidator.Auction",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

/**
 * Place a bid on an active auction
 */
export function usePlaceBid(liquidatorAddress: Address) {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({
      auctionId,
      bidAmount,
      borrowAssetAddress,
      borrowAssetDecimals
    }: {
      auctionId: number;
      bidAmount: string;
      borrowAssetAddress: Address;
      borrowAssetDecimals: number;
    }) => {
      await ensureLocalChain();
      const bidWei = parseUnits(bidAmount, borrowAssetDecimals);

      // Step 1: Approve tokens
      const approveTxHash = await writeContractAsync({
        address: borrowAssetAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [liquidatorAddress, bidWei],
        chainId: localChain.id,
      });

      const approveReceipt = await publicClient!.waitForTransactionReceipt({ hash: approveTxHash });
      if (approveReceipt.status !== 'success') throw new Error('Approval transaction failed');

      // Step 2: Place bid
      const bidTxHash = await writeContractAsync({
        address: liquidatorAddress,
        abi: LIQUIDATOR_ABI,
        functionName: 'placeBid',
        args: [BigInt(auctionId), bidWei],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: bidTxHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Bid placed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to place bid: ${error.message}`);
    },
  });
}

/**
 * Settle an auction after it ends
 */
export function useSettleAuction(liquidatorAddress: Address) {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ auctionId }: { auctionId: number }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: liquidatorAddress,
        abi: LIQUIDATOR_ABI,
        functionName: 'settleAuction',
        args: [BigInt(auctionId)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      toast.success('Auction settled successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to settle auction: ${error.message}`);
    },
  });
}

/**
 * Get current Dutch auction price
 */
export function useCurrentPrice(liquidatorAddress: Address | undefined, auctionId: number | undefined) {
  return useReadContract({
    address: liquidatorAddress,
    abi: LIQUIDATOR_ABI,
    functionName: 'getCurrentPrice',
    args: auctionId !== undefined ? [BigInt(auctionId)] : undefined,
    query: {
      enabled: !!liquidatorAddress && auctionId !== undefined,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
    chainId: localChain.id,
  });
}

/**
 * Get auction details
 */
export function useAuctionDetails(liquidatorAddress: Address | undefined, auctionId: number | undefined) {
  return useReadContract({
    address: liquidatorAddress,
    abi: LIQUIDATOR_ABI,
    functionName: 'getAuction',
    args: auctionId !== undefined ? [BigInt(auctionId)] : undefined,
    query: {
      enabled: !!liquidatorAddress && auctionId !== undefined,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
    chainId: localChain.id,
  });
}
