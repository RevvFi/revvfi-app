"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWriteContract, usePublicClient } from "wagmi";
import { readContract } from "@wagmi/core";
import { parseUnits, type Address } from "viem";
import { toast } from "sonner";
import { positionService, type PositionsParams } from "@/services/position.service";
import { withdrawalService } from "@/services/withdrawal.service";
import { queryKeys } from "@/constants/query-keys";
import { MARKET_ABI, LIQUIDITY_QUEUE_ABI } from "@/lib/contracts/abis";
import { wagmiConfig } from "@/providers/wagmi-config";
import { localChain } from "@/constants/chains";
import { useAuthStore } from "@/store/auth.store";
import { useEnsureLocalChain } from "@/hooks/useEnsureLocalChain";

export function usePositions(params?: PositionsParams) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.positions.all(params),
    queryFn: () => positionService.getPositions(params),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function usePosition(tokenId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.positions.detail(tokenId),
    queryFn: () => positionService.getPosition(tokenId),
    enabled: isAuthenticated && tokenId > 0,
  });
}

export function usePortfolio() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.positions.portfolio,
    queryFn: positionService.getPortfolio,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function useClaimPosition() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ tokenId, marketAddress }: { tokenId: number; marketAddress: string }) => {
      await ensureLocalChain();
      // Call Market.claimFunds(positionId) on-chain
      const txHash = await writeContractAsync({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "claimFunds",
        args: [BigInt(tokenId)],
        chainId: localChain.id,
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      toast.success("Funds claimed successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useWithdrawals() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.withdrawals.all(),
    queryFn: withdrawalService.getWithdrawals,
    enabled: isAuthenticated,
  });
}

export interface CreateWithdrawalParams {
  marketAddress: string;
  positionId: number;
  amount: string;
  borrowAssetDecimals: number;
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async ({
      marketAddress,
      positionId,
      amount,
      borrowAssetDecimals,
    }: CreateWithdrawalParams) => {
      await ensureLocalChain();
      const amountWei = parseUnits(amount, borrowAssetDecimals);

      // Step 1: Read LiquidityQueue address from Market
      toast.info("Getting LiquidityQueue address…");
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress as Address,
        abi: MARKET_ABI,
        functionName: "liquidityQueue",
        chainId: localChain.id,
      })) as Address;

      // Step 2: Call LiquidityQueue.requestWithdrawal()
      toast.info("Submitting withdrawal request on-chain…");
      const txHash = await writeContractAsync({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: "requestWithdrawal",
        args: [BigInt(positionId), amountWei],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      // Step 3: Backend sync (best-effort)
      try {
        await withdrawalService.createWithdrawal({
          position_id: positionId,
          amount: amount,
        });
      } catch {
        // non-fatal: indexer will sync from WithdrawalRequested event
      }

      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      toast.success("Withdrawal request submitted successfully");
    },
    onError: (e: Error) => {
      console.error("Create withdrawal failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("PositionLocked")) {
        toast.error("Position is already locked for withdrawal");
      } else if (e.message?.includes("AmountExceedsBalance")) {
        toast.error("Withdrawal amount exceeds position balance");
      } else {
        toast.error(e.message || "Failed to create withdrawal request");
      }
    },
  });
}

export interface CancelWithdrawalParams {
  marketAddress: string;
  requestId: number;
}

export function useCancelWithdrawal() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress, requestId }: CancelWithdrawalParams) => {
      await ensureLocalChain();
      // Step 1: Read LiquidityQueue address from Market
      toast.info("Getting LiquidityQueue address…");
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress as Address,
        abi: MARKET_ABI,
        functionName: "liquidityQueue",
        chainId: localChain.id,
      })) as Address;

      // Step 2: Call LiquidityQueue.cancelWithdrawal()
      toast.info("Cancelling withdrawal on-chain…");
      const txHash = await writeContractAsync({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: "cancelWithdrawal",
        args: [BigInt(requestId)],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      // Step 3: Backend sync (best-effort)
      try {
        await withdrawalService.cancelWithdrawal({ request_id: requestId });
      } catch {
        // non-fatal: indexer will sync
      }

      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      toast.success("Withdrawal cancelled successfully");
    },
    onError: (e: Error) => {
      console.error("Cancel withdrawal failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("WithdrawalNotFound")) {
        toast.error("Withdrawal request not found");
      } else if (e.message?.includes("AlreadyProcessed")) {
        toast.error("Cannot cancel - withdrawal already processed");
      } else {
        toast.error(e.message || "Failed to cancel withdrawal");
      }
    },
  });
}

export function useWithdrawalEpoch() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.withdrawals.epoch,
    queryFn: withdrawalService.getCurrentEpoch,
    enabled: isAuthenticated,
  });
}

export interface ClaimWithdrawalParams {
  marketAddress: string;
  requestId: number;
}

export interface ProcessEpochParams {
  marketAddress: string;
  epochNumber: number;
  availableLiquidity: string;
  borrowAssetDecimals: number;
}

/**
 * Process a withdrawal epoch (Admin/Factory only)
 * Calculates pro-rata fulfillment for all withdrawal requests in the epoch
 */
export function useProcessEpoch() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async ({
      marketAddress,
      epochNumber,
      availableLiquidity,
      borrowAssetDecimals,
    }: ProcessEpochParams) => {
      await ensureLocalChain();
      const liquidityWei = parseUnits(availableLiquidity, borrowAssetDecimals);

      // Step 1: Read LiquidityQueue address from Market
      toast.info("Getting LiquidityQueue address…");
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress as Address,
        abi: MARKET_ABI,
        functionName: "liquidityQueue",
        chainId: localChain.id,
      })) as Address;

      // Step 2: Call LiquidityQueue.processEpoch()
      toast.info(`Processing epoch ${epochNumber}...`);
      const txHash = await writeContractAsync({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: "processEpoch",
        args: [BigInt(epochNumber), liquidityWei],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction failed");
      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals.epoch });
      toast.success("Epoch processed successfully");
    },
    onError: (e: Error) => {
      console.error("Process epoch failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("UnauthorizedCaller")) {
        toast.error("Only factory owner can process epochs");
      } else if (e.message?.includes("EpochNotComplete")) {
        toast.error("Epoch already processed");
      } else if (e.message?.includes("WithdrawalTooEarly")) {
        toast.error("Epoch has not ended yet");
      } else {
        toast.error(e.message || "Failed to process epoch");
      }
    },
  });
}

/**
 * Claim a processed withdrawal
 *
 * NOTE: claimWithdrawal has an onlyMarket modifier but its logic checks
 * msg.sender == lender - calling directly may revert with "UnauthorizedCaller"
 * until that's fixed contract-side.
 */
export function useClaimWithdrawal() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const ensureLocalChain = useEnsureLocalChain();
  const publicClient = usePublicClient({ chainId: localChain.id });

  return useMutation({
    mutationFn: async ({ marketAddress, requestId }: ClaimWithdrawalParams) => {
      await ensureLocalChain();
      // Step 1: Read LiquidityQueue address from Market
      toast.info("Getting LiquidityQueue address…");
      const liquidityQueueAddr = (await readContract(wagmiConfig, {
        address: marketAddress as Address,
        abi: MARKET_ABI,
        functionName: "liquidityQueue",
        chainId: localChain.id,
      })) as Address;

      // Step 2: Read withdrawal request details to get fulfilled amount
      const request = (await publicClient!.readContract({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: "getWithdrawalRequest",
        args: [BigInt(requestId)],
      })) as any;

      if (!request.processed) {
        throw new Error("Withdrawal not processed yet. Wait for epoch to complete.");
      }

      if (request.claimed) {
        throw new Error("Withdrawal already claimed");
      }

      const fulfilledAmount = request.fulfilledAmount;
      if (fulfilledAmount === BigInt(0)) {
        throw new Error("No funds available to claim");
      }

      // Step 3: Call LiquidityQueue.claimWithdrawal()
      toast.info("Claiming withdrawal on-chain…");
      const txHash = await writeContractAsync({
        address: liquidityQueueAddr,
        abi: LIQUIDITY_QUEUE_ABI,
        functionName: "claimWithdrawal",
        args: [BigInt(requestId), fulfilledAmount],
        chainId: localChain.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      return txHash;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      toast.success("Withdrawal claimed successfully");
    },
    onError: (e: Error) => {
      console.error("Claim withdrawal failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("UnauthorizedCaller")) {
        toast.error("Smart contract issue: claimWithdrawal has onlyMarket modifier. Contact admin.");
      } else if (e.message?.includes("EpochNotComplete")) {
        toast.error("Epoch not processed yet");
      } else if (e.message?.includes("PositionAlreadyRedeemed")) {
        toast.error("Withdrawal already claimed");
      } else {
        toast.error(e.message || "Failed to claim withdrawal");
      }
    },
  });
}
