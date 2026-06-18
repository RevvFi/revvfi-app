import { get } from "@/lib/api";
import type { Auction, AuctionPrice, LiquidationsResponse } from "@/types";

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
};
