import { get } from "@/lib/api";
import type { Auction, AuctionBid, AuctionPrice, LiquidationsResponse } from "@/types";

export const auctionService = {
  async getLiquidations(): Promise<LiquidationsResponse> {
    return get<LiquidationsResponse>("/liquidations");
  },

  async getAuction(id: number): Promise<Auction> {
    return get<Auction>(`/liquidations/auctions/${id}`);
  },

  async getAuctionPrice(id: number): Promise<AuctionPrice> {
    return get<AuctionPrice>(`/liquidations/auctions/${id}/price`);
  },

  async getAuctionBids(id: number): Promise<{ bids: AuctionBid[]; count: number }> {
    return get<{ bids: AuctionBid[]; count: number }>(`/liquidations/auctions/${id}/bids`);
  },

  async getAuctionsByMarket(marketAddress: string, status?: string): Promise<{ auctions: Auction[] }> {
    const params = new URLSearchParams({ market_address: marketAddress });
    if (status) params.set("status", status);
    return get<{ auctions: Auction[] }>(`/liquidations/auctions?${params.toString()}`);
  },
};
