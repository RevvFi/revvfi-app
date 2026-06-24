import { get, post } from "@/lib/api";
import type { Borrower, BorrowerRisk } from "@/types";

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
};
