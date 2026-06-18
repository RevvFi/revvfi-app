import { post } from "@/lib/api";
import type { BorrowRequest, GasQuote, LiquidateRequest, QuoteTxRequest, RepayRequest, UnsignedTx } from "@/types";

export const transactionService = {
  async buildBorrowTx(payload: BorrowRequest): Promise<UnsignedTx> {
    return post<UnsignedTx>("/transactions/borrow", payload);
  },

  async buildRepayTx(payload: RepayRequest): Promise<UnsignedTx> {
    return post<UnsignedTx>("/transactions/repay", payload);
  },

  async buildLiquidateTx(payload: LiquidateRequest): Promise<UnsignedTx> {
    return post<UnsignedTx>("/transactions/liquidate", payload);
  },

  async getGasQuote(payload: QuoteTxRequest): Promise<GasQuote> {
    return post<GasQuote>("/transactions/quote", payload);
  },
};
