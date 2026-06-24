import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, Address } from 'viem';
import { wagmiConfig } from '@/providers/wagmi-config';
import { toast } from 'sonner';

const FACTORY_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "newFee", "type": "uint256"}],
    "name": "setDeploymentFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newRecipient", "type": "address"}],
    "name": "setFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newArchController", "type": "address"}],
    "name": "requestArchControllerUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "executeArchControllerUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelArchControllerUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deploymentFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRecipient",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingArchController",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "archControllerUpdateTime",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address;

// Read hooks
export function useDeploymentFee() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'deploymentFee',
  });
}

export function useFeeRecipient() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'feeRecipient',
  });
}

export function usePendingArchController() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'pendingArchController',
  });
}

export function useArchControllerUpdateTime() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'archControllerUpdateTime',
  });
}

// Write hooks
export function useSetDeploymentFee() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feeInEther }: { feeInEther: string }) => {
      const feeWei = parseEther(feeInEther);

      const txHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'setDeploymentFee',
        args: [feeWei],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deploymentFee'] });
      toast.success('Deployment fee updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Error setting deployment fee:', error);
      toast.error(`Failed to update deployment fee: ${error.message}`);
    },
  });
}

export function useSetFeeRecipient() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient }: { recipient: Address }) => {
      const txHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'setFeeRecipient',
        args: [recipient],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeRecipient'] });
      toast.success('Fee recipient updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Error setting fee recipient:', error);
      toast.error(`Failed to update fee recipient: ${error.message}`);
    },
  });
}

export function useRequestArchControllerUpdate() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ newArchController }: { newArchController: Address }) => {
      const txHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'requestArchControllerUpdate',
        args: [newArchController],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingArchController'] });
      queryClient.invalidateQueries({ queryKey: ['archControllerUpdateTime'] });
      toast.success('ArchController update requested! Will be executable after 2-day timelock.');
    },
    onError: (error: Error) => {
      console.error('Error requesting ArchController update:', error);
      toast.error(`Failed to request update: ${error.message}`);
    },
  });
}

export function useExecuteArchControllerUpdate() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const txHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'executeArchControllerUpdate',
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingArchController'] });
      queryClient.invalidateQueries({ queryKey: ['archControllerUpdateTime'] });
      toast.success('ArchController updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Error executing ArchController update:', error);
      if (error.message.includes('timelock')) {
        toast.error('Timelock period has not elapsed yet. Please wait 2 days after requesting the update.');
      } else {
        toast.error(`Failed to execute update: ${error.message}`);
      }
    },
  });
}

export function useCancelArchControllerUpdate() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const txHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'cancelArchControllerUpdate',
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingArchController'] });
      queryClient.invalidateQueries({ queryKey: ['archControllerUpdateTime'] });
      toast.success('ArchController update cancelled!');
    },
    onError: (error: Error) => {
      console.error('Error cancelling ArchController update:', error);
      toast.error(`Failed to cancel update: ${error.message}`);
    },
  });
}
