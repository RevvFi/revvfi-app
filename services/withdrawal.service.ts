import { get, post } from "@/lib/api";
import type { CancelWithdrawalRequest, Withdrawal, WithdrawalEpoch, WithdrawalRequest, WithdrawalsResponse } from "@/types";

export const withdrawalService = {
  async getWithdrawals(): Promise<WithdrawalsResponse> {
    return get<WithdrawalsResponse>("/withdrawals");
  },

  async createWithdrawal(payload: WithdrawalRequest): Promise<Withdrawal> {
    return post<Withdrawal>("/withdrawals", payload);
  },

  async cancelWithdrawal(payload: CancelWithdrawalRequest): Promise<{ message: string }> {
    return post<{ message: string }>("/withdrawals/cancel", payload);
  },

  async getCurrentEpoch(): Promise<WithdrawalEpoch> {
    return get<WithdrawalEpoch>("/withdrawals/current-epoch");
  },
};
