import { get, post } from "@/lib/api";
import type { Borrower, BorrowerRisk } from "@/types";

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
};
