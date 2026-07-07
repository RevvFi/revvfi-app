import { get, patch, post } from "@/lib/api";
import type { Borrower, BorrowerRequest, BorrowerRequestListResponse, BorrowerRisk } from "@/types";

export interface CollateralBalance {
  Borrower: string;
  Balance: number | string;
  TotalDeposited: number | string;
  TotalWithdrawn: number | string;
  LastDepositAt: {
    Time: string;
    Valid: boolean;
  };
  LastWithdrawalAt: {
    Time: string;
    Valid: boolean;
  };
  UpdatedAt: string;
}

export const borrowerService = {
  async getBorrower(address: string): Promise<Borrower> {
    return get<Borrower>(`/borrowers/${address}`);
  },

  async getBorrowerRisk(address: string): Promise<BorrowerRisk> {
    return get<BorrowerRisk>(`/borrowers/${address}/risk`);
  },

  async registerBorrower(): Promise<Borrower> {
    return post<Borrower>("/borrowers/register", {});
  },

  async getCollateralBalance(address: string): Promise<CollateralBalance | null> {
    return get<CollateralBalance>(`/borrowers/${address}/collateral`);
  },

  // ── Borrower access requests ──────────────────────────────────────────
  // registerBorrower() on-chain is onlyOwner (admin), so a signed-in wallet
  // can only ever ask for access via this off-chain review queue.
  async requestAccess(): Promise<BorrowerRequest> {
    return post<BorrowerRequest>("/borrower-requests", {});
  },

  async getMyRequest(): Promise<BorrowerRequest | null> {
    return get<BorrowerRequest | null>("/borrower-requests/me");
  },

  async listRequests(status?: string): Promise<BorrowerRequestListResponse> {
    return get<BorrowerRequestListResponse>("/admin/borrower-requests", { params: status ? { status } : undefined });
  },

  async rejectRequest(id: number, note?: string): Promise<{ message: string }> {
    return patch<{ message: string }>(`/admin/borrower-requests/${id}/reject`, { note });
  },
};
