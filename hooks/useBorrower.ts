"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits, type Address } from "viem";
import { toast } from "sonner";
import { borrowerService } from "@/services/borrower.service";
import { queryKeys } from "@/constants/query-keys";
import { MARKET_ABI } from "@/lib/contracts/abis";
import type { RepayRequest } from "@/types";

export function useBorrower(address: string) {
  return useQuery({
    queryKey: queryKeys.borrowers.detail(address),
    queryFn: () => borrowerService.getBorrower(address),
    enabled: !!address,
  });
}

export function useCollateralBalance(borrowerAddress: string) {
  return useQuery({
    queryKey: ["collateral", borrowerAddress],
    queryFn: () => borrowerService.getCollateralBalance(borrowerAddress),
    enabled: !!borrowerAddress,
  });
}

export function useBorrowerRisk(address: string) {
  return useQuery({
    queryKey: queryKeys.borrowers.risk(address),
    queryFn: () => borrowerService.getBorrowerRisk(address),
    enabled: !!address,
    refetchInterval: 30_000,
  });
}

// NOTE: useRegisterBorrower has been removed from here.
// Use the blockchain-based implementation from hooks/useArchController.ts instead.
// import { useRegisterBorrower } from '@/hooks/useArchController';

export interface DepositCollateralParams {
  marketAddress: string;
  collateralAssetAddress: string;
  collateralAssetDecimals: number;
  amount: string;
}

export function useDepositCollateral() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({
      marketAddress,
      collateralAssetAddress,
      collateralAssetDecimals,
      amount,
    }: DepositCollateralParams) => {
      const amountWei = parseUnits(amount, collateralAssetDecimals);
      const marketAddr = marketAddress as Address;
      const tokenAddr = collateralAssetAddress as Address;

      // Step 1 — approve the Market to pull collateral from borrower
      // Note: Market pulls tokens to itself first, then forwards to Escrow
      toast.info("Step 1/2: Approving collateral spend to Market…");
      const approveTx = await writeContractAsync({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: "approve",
        args: [marketAddr, amountWei], // ← Approve to Market, not Escrow!
      });
      await publicClient!.waitForTransactionReceipt({ hash: approveTx });

      // Step 2 — deposit via Market.depositCollateral(amount)
      toast.info("Step 2/2: Depositing collateral on-chain…");
      const depositTx = await writeContractAsync({
        address: marketAddr,
        abi: MARKET_ABI,
        functionName: "depositCollateral",
        args: [amountWei],
      });
      await publicClient!.waitForTransactionReceipt({ hash: depositTx });
      return depositTx;
    },
    onSuccess: (txHash) => {
      // Borrower record + all on-chain market-health reads (collateral ratio, totalAssets, etc.)
      qc.invalidateQueries({ queryKey: queryKeys.borrowers.detail("") });
      qc.invalidateQueries({ queryKey: ["market"] });
      toast.success(`Collateral deposited · ${txHash.slice(0, 10)}…`);
    },
    onError: (e: Error) => {
      console.error("Deposit collateral failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("allowance") || e.message?.includes("exceeds allowance")) {
        toast.error("Token approval failed — please try again");
      } else if (e.message?.includes("insufficient funds")) {
        toast.error("Insufficient wallet balance for this deposit");
      } else {
        toast.error(e.message || "Collateral deposit failed");
      }
    },
  });
}

export interface WithdrawCollateralParams {
  marketAddress: string;
  collateralAssetDecimals: number;
  amount: string;
}

export function useWithdrawCollateral() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({
      marketAddress,
      collateralAssetDecimals,
      amount,
    }: WithdrawCollateralParams) => {
      const amountWei = parseUnits(amount, collateralAssetDecimals);
      const txHash = await writeContractAsync({
        address: marketAddress as Address,
        abi: MARKET_ABI,
        functionName: "withdrawCollateral",
        args: [amountWei],
      });
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    },
    onSuccess: (txHash) => {
      qc.invalidateQueries({ queryKey: queryKeys.borrowers.detail("") });
      qc.invalidateQueries({ queryKey: ["market"] });
      toast.success(`Collateral withdrawn · ${txHash.slice(0, 10)}…`);
    },
    onError: (e: Error) => {
      console.error("Withdraw collateral failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("InsufficientCollateral") || e.message?.includes("ExceedsCollateral")) {
        toast.error("Withdrawal exceeds available collateral");
      } else if (e.message?.includes("WouldBeLiquidatable")) {
        toast.error("Cannot withdraw — position would become liquidatable");
      } else {
        toast.error(e.message || "Collateral withdrawal failed");
      }
    },
  });
}

export interface BorrowOnChainParams {
  market_address: string;
  borrow_amount: string;
  borrow_asset_decimals: number;
  use_senior_only?: boolean;
  max_apr?: number;
}

export function useBorrow() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async (payload: BorrowOnChainParams) => {
      const {
        market_address,
        borrow_amount,
        borrow_asset_decimals,
        use_senior_only = false,
        max_apr = 10000, // 100% default max APR
      } = payload;

      const borrowAmountWei = parseUnits(borrow_amount, borrow_asset_decimals);

      // Call Market.borrow() directly on-chain
      // The Market contract will:
      // 1. Call OfferBook.executeDrawdown() to match best offers
      // 2. Mint Position NFTs to lenders
      // 3. Transfer borrowed funds to borrower
      toast.info("Submitting borrow request…");
      const txHash = await writeContractAsync({
        address: market_address as Address,
        abi: MARKET_ABI,
        functionName: "borrow",
        args: [borrowAmountWei, use_senior_only, BigInt(max_apr)],
      });

      toast.info("Waiting for confirmation…");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error("Transaction failed");
      }

      return txHash;
    },
    onSuccess: (txHash) => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      qc.invalidateQueries({ queryKey: queryKeys.borrowers.detail("") });
      // Risk score and health factor
      qc.invalidateQueries({ queryKey: ["borrowers", "risk"] });
      // All on-chain market reads (debt, collateral ratio, health, max-borrowable)
      qc.invalidateQueries({ queryKey: ["market"] });
      // Offer book reads (liquidity, best-offers preview) — offers get filled by borrow
      qc.invalidateQueries({ queryKey: ["offerBook"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      toast.success(`Borrow confirmed · ${txHash.slice(0, 10)}…`);
    },
    onError: (e: Error) => {
      console.error("Borrow failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("InsufficientLiquidity")) {
        toast.error("Not enough liquidity available at requested APR");
      } else if (e.message?.includes("InsufficientCollateral")) {
        toast.error("Insufficient collateral for this borrow amount");
      } else if (e.message?.includes("MaxAPRExceeded")) {
        toast.error("Best available APR exceeds your maximum");
      } else {
        toast.error(e.message || "Borrow transaction failed");
      }
    },
  });
}

export interface RepayOnChainParams extends RepayRequest {
  borrow_asset_address: string;
  borrow_asset_decimals: number;
}

export function useRepay() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async (payload: RepayOnChainParams) => {
      const { market_address, amount, borrow_asset_address, borrow_asset_decimals } = payload;
      const amountWei = parseUnits(amount, borrow_asset_decimals);

      // Step 1 — approve Market to pull borrow asset from borrower for repayment
      toast.info("Step 1/2: Approving repayment spend…");
      const approveTx = await writeContractAsync({
        address: borrow_asset_address as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [market_address as Address, amountWei],
      });
      await publicClient!.waitForTransactionReceipt({ hash: approveTx });

      // Step 2 — call Market.repay() directly
      toast.info("Step 2/2: Submitting repayment…");
      const repayTx = await writeContractAsync({
        address: market_address as Address,
        abi: MARKET_ABI,
        functionName: "repay",
        args: [amountWei],
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: repayTx });

      if (receipt.status !== 'success') {
        throw new Error("Transaction failed");
      }

      return repayTx;
    },
    onSuccess: (txHash) => {
      qc.invalidateQueries({ queryKey: queryKeys.borrowers.detail("") });
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      // Risk score, health factor, and all on-chain market reads
      qc.invalidateQueries({ queryKey: ["borrowers", "risk"] });
      qc.invalidateQueries({ queryKey: ["market"] });
      toast.success(`Repayment confirmed · ${txHash.slice(0, 10)}…`);
    },
    onError: (e: Error) => {
      console.error("Repay failed:", e);
      if (e.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (e.message?.includes("InsufficientBalance")) {
        toast.error("Insufficient balance to repay");
      } else {
        toast.error(e.message || "Repayment failed");
      }
    },
  });
}
