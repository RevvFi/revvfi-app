"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { positionService, type PositionsParams } from "@/services/position.service";
import { withdrawalService } from "@/services/withdrawal.service";
import { queryKeys } from "@/constants/query-keys";
import type { WithdrawalRequest } from "@/types";
import { useAuthStore } from "@/store/auth.store";

export function usePositions(params?: PositionsParams) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.positions.all(params),
    queryFn: () => positionService.getPositions(params),
    enabled: isAuthenticated,
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
  return useMutation({
    mutationFn: (tokenId: number) => positionService.claimPosition({ token_id: tokenId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      toast.success("Position claimed successfully");
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

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawalRequest) => withdrawalService.createWithdrawal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      toast.success("Withdrawal request submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => withdrawalService.cancelWithdrawal({ request_id: requestId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      toast.success("Withdrawal cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
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
