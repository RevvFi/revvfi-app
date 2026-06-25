import { get, post } from "@/lib/api";
import type { ClaimPositionRequest, Portfolio, Position, PositionsResponse } from "@/types";

export interface PositionsParams {
  page?: number;
  limit?: number;
  status?: string;
  market_address?: string;
  lender?: string; // Filter positions by lender address
}

export const positionService = {
  async getPositions(params?: PositionsParams): Promise<PositionsResponse> {
    return get<PositionsResponse>("/positions", { params });
  },

  async getPosition(tokenId: number): Promise<Position> {
    return get<Position>(`/positions/${tokenId}`);
  },

  async getPortfolio(): Promise<Portfolio> {
    return get<Portfolio>("/positions/portfolio");
  },

  async claimPosition(payload: ClaimPositionRequest): Promise<{ message: string }> {
    return post<{ message: string }>("/positions/claim", payload);
  },
};
