"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { offerService, type OffersParams } from "@/services/offer.service";
import { queryKeys } from "@/constants/query-keys";
import type { CreateOfferRequest, QuoteRequest } from "@/types";

export function useOffers(params?: OffersParams) {
  return useQuery({
    queryKey: queryKeys.offers.all(params),
    queryFn: () => offerService.getOffers(params),
  });
}

export function useOffer(id: number) {
  return useQuery({
    queryKey: queryKeys.offers.detail(id),
    queryFn: () => offerService.getOffer(id),
    enabled: id > 0,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOfferRequest) => offerService.createOffer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offers.all() });
      qc.invalidateQueries({ queryKey: queryKeys.positions.portfolio });
      toast.success("Offer created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => offerService.cancelOffer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offers.all() });
      toast.success("Offer cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useQuote(params?: QuoteRequest) {
  return useQuery({
    queryKey: queryKeys.offers.quote(params),
    queryFn: () => offerService.getQuote(params!),
    enabled: !!params?.market_address && !!params.borrow_amount,
  });
}
