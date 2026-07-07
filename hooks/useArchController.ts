import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWriteContract, useReadContract } from 'wagmi';
import { localChain } from '@/constants/chains';
import { Address } from 'viem';
import { wagmiConfig } from '@/providers/wagmi-config';
import { toast } from 'sonner';
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

const ARCH_CONTROLLER_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "borrower", "type": "address"}],
    "name": "registerBorrower",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "borrower", "type": "address"}],
    "name": "removeBorrower",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "asset", "type": "address"}],
    "name": "addBlacklist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "asset", "type": "address"}],
    "name": "removeBlacklist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "factory", "type": "address"}],
    "name": "removeControllerFactory",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "controller", "type": "address"}],
    "name": "removeController",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "market", "type": "address"}],
    "name": "removeMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "borrower", "type": "address"}],
    "name": "isRegisteredBorrower",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isBlacklisted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const ARCH_CONTROLLER_ADDRESS = process.env.NEXT_PUBLIC_ARCH_CONTROLLER_ADDRESS as Address;

// Read hooks
// Was previously wired to a nonexistent "isApprovedBorrower" function (the
// real getter on RevvFiArchController.sol is isRegisteredBorrower) - every
// call reverted. Harmless in practice since nothing else in the app called
// this hook, but fixed for correctness since a future caller would silently
// get `undefined` forever otherwise.
export function useIsRegisteredBorrower(address: Address | undefined) {
  return useReadContract({
    address: ARCH_CONTROLLER_ADDRESS,
    abi: ARCH_CONTROLLER_ABI,
    functionName: 'isRegisteredBorrower',
    args: address ? [address] : undefined,
    chainId: localChain.id,
    query: { enabled: !!address },
  });
}

export function useIsBlacklisted(assetAddress: Address | undefined) {
  return useReadContract({
    address: ARCH_CONTROLLER_ADDRESS,
    abi: ARCH_CONTROLLER_ABI,
    functionName: 'isBlacklisted',
    args: assetAddress ? [assetAddress] : undefined,
    chainId: localChain.id,
  });
}

/**
 * registerBorrower/removeBorrower/addBlacklist/etc. are all `onlyOwner` on
 * the ArchController contract (plain OpenZeppelin Ownable) — only the
 * address that deployed it may call them. Any other wallet's tx reverts
 * with OwnableUnauthorizedAccount. UI that gates these actions must check
 * against this, not just "is a wallet connected."
 */
export function useArchControllerOwner() {
  return useReadContract({
    address: ARCH_CONTROLLER_ADDRESS,
    abi: ARCH_CONTROLLER_ABI,
    functionName: 'owner',
    chainId: localChain.id,
  });
}

export function useIsArchControllerOwner(address: Address | undefined) {
  const { data: owner } = useArchControllerOwner();
  return !!address && !!owner && address.toLowerCase() === (owner as string).toLowerCase();
}

// Write hooks
export function useRegisterBorrower() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ borrower }: { borrower: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: ARCH_CONTROLLER_ADDRESS,
        abi: ARCH_CONTROLLER_ABI,
        functionName: 'registerBorrower',
        args: [borrower],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error('Transaction failed');
      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      toast.success('Borrower registered successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to register borrower: ${error.message}`);
    },
  });
}

export function useRemoveBorrower() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ borrower }: { borrower: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: ARCH_CONTROLLER_ADDRESS,
        abi: ARCH_CONTROLLER_ABI,
        functionName: 'removeBorrower',
        args: [borrower],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      toast.success('Borrower removed successfully!');
    },
    onError: (error: Error) => {
      console.error('Error removing borrower:', error);
      toast.error(`Failed to remove borrower: ${error.message}`);
    },
  });
}

export function useAddBlacklist() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ asset }: { asset: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: ARCH_CONTROLLER_ADDRESS,
        abi: ARCH_CONTROLLER_ABI,
        functionName: 'addBlacklist',
        args: [asset],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
      toast.success('Asset blacklisted successfully!');
    },
    onError: (error: Error) => {
      console.error('Error blacklisting asset:', error);
      toast.error(`Failed to blacklist asset: ${error.message}`);
    },
  });
}

export function useRemoveBlacklist() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ asset }: { asset: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: ARCH_CONTROLLER_ADDRESS,
        abi: ARCH_CONTROLLER_ABI,
        functionName: 'removeBlacklist',
        args: [asset],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
      toast.success('Asset removed from blacklist!');
    },
    onError: (error: Error) => {
      console.error('Error removing asset from blacklist:', error);
      toast.error(`Failed to remove from blacklist: ${error.message}`);
    },
  });
}

export function useRemoveMarket() {
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ config: wagmiConfig, chainId: localChain.id });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ market }: { market: Address }) => {
      await ensureLocalChain();
      const txHash = await writeContractAsync({
        address: ARCH_CONTROLLER_ADDRESS,
        abi: ARCH_CONTROLLER_ABI,
        functionName: 'removeMarket',
        args: [market],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('Market removed successfully!');
    },
    onError: (error: Error) => {
      console.error('Error removing market:', error);
      toast.error(`Failed to remove market: ${error.message}`);
    },
  });
}
