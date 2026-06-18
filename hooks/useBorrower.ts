"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { borrowerService } from "@/services/borrower.service";
import { transactionService } from "@/services/transaction.service";
import { queryKeys } from "@/constants/query-keys";
import type { BorrowRequest, RepayRequest } from "@/types";
import { useSendTransaction } from "wagmi";

export function useBorrower(address: string) {
  return useQuery({
    queryKey: queryKeys.borrowers.detail(address),
    queryFn: () => borrowerService.getBorrower(address),
    enabled: !!address,
  });
}

export function useBorrowerRisk(address: string) {
  return useQuery({
    queryKey: queryKeys.borrowers.risk(address),
    queryFn: () => borrowerService.getBorrowerRisk(address),
    enabled: !!address,
  });
}

export function useRegisterBorrower() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: borrowerService.registerBorrower,
    onSuccess: () => {
      toast.success("Borrower registered successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBorrow() {
  const qc = useQueryClient();
  const { sendTransactionAsync } = useSendTransaction();

  return useMutation({
    mutationFn: async (payload: BorrowRequest) => {
      const unsigned = await transactionService.buildBorrowTx(payload);
      const hash = await sendTransactionAsync({
        to: unsigned.to as `0x${string}`,
        data: unsigned.data as `0x${string}`,
        value: BigInt(unsigned.value),
      });
      return hash;
    },
    onSuccess: (hash) => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      toast.success(`Borrow submitted: ${hash.slice(0, 10)}…`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRepay() {
  const qc = useQueryClient();
  const { sendTransactionAsync } = useSendTransaction();

  return useMutation({
    mutationFn: async (payload: RepayRequest) => {
      const unsigned = await transactionService.buildRepayTx(payload);
      const hash = await sendTransactionAsync({
        to: unsigned.to as `0x${string}`,
        data: unsigned.data as `0x${string}`,
        value: BigInt(unsigned.value),
      });
      return hash;
    },
    onSuccess: (hash) => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      toast.success(`Repayment submitted: ${hash.slice(0, 10)}…`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
