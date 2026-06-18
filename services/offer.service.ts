import { del, get, post } from "@/lib/api";
import type { CreateOfferRequest, Offer, OffersResponse, QuoteRequest, QuoteResponse } from "@/types";

export interface OffersParams {
  page?: number;
  limit?: number;
  market_address?: string;
  lender?: string;
  status?: string;
}

export const offerService = {
  async getOffers(params?: OffersParams): Promise<OffersResponse> {
    return get<OffersResponse>("/offers", { params });
  },

  async getOffer(id: number): Promise<Offer> {
    return get<Offer>(`/offers/${id}`);
  },

  async createOffer(payload: CreateOfferRequest): Promise<Offer> {
    return post<Offer>("/offers", payload);
  },

  async cancelOffer(id: number): Promise<{ message: string }> {
    return del<{ message: string }>(`/offers/${id}`);
  },

  async getQuote(payload: QuoteRequest): Promise<QuoteResponse> {
    return post<QuoteResponse>("/offers/quote", payload);
  },
};
