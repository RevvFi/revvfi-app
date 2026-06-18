import { get, post } from "@/lib/api";
import type { CreateMarketRequest, Market, MarketMetrics, MarketsResponse } from "@/types";

export interface MarketsParams {
  page?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
}

export const marketService = {
  async getMarkets(params?: MarketsParams): Promise<MarketsResponse> {
    return get<MarketsResponse>("/markets", { params });
  },

  async getMarket(address: string): Promise<Market> {
    return get<Market>(`/markets/${address}`);
  },

  async getMarketMetrics(address: string): Promise<MarketMetrics> {
    return get<MarketMetrics>(`/markets/${address}/metrics`);
  },

  async createMarket(payload: CreateMarketRequest): Promise<Market> {
    return post<Market>("/markets", payload);
  },
};
