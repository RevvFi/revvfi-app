"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { borrowerService } from "@/services/borrower.service";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/store/auth.store";

/**
 * The wallet's own borrower access request status. registerBorrower() is
 * onlyOwner on-chain, so this off-chain queue is the only way a regular
 * wallet can ask an admin to be approved. Requires an authenticated (SIWE)
 * session — the wallet identity for the request comes from the server-side
 * JWT, never from client input.
 */
export function useMyBorrowerRequest() {
  const { isAuthenticated, user } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.borrowers.myRequest(user?.wallet_address),
    queryFn: () => borrowerService.getMyRequest(),
    enabled: isAuthenticated,
  });
}

export function useRequestBorrowerAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => borrowerService.requestAccess(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["borrowers", "myRequest"] });
      toast.success("Borrower access requested — an admin will review it shortly");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to request borrower access"),
  });
}

/**
 * Admin review queue. Approval happens by sending the real on-chain
 * registerBorrower() tx (see useRegisterBorrower in useArchController.ts);
 * this list refreshes on an interval so an approved request's disappearance
 * (once the indexer processes the BorrowerAdded event) is visible without
 * a manual refresh.
 */
export function usePendingBorrowerRequests(status: string = "pending") {
  return useQuery({
    queryKey: queryKeys.admin.borrowerRequests(status),
    queryFn: () => borrowerService.listRequests(status),
    refetchInterval: 5_000,
  });
}

export function useRejectBorrowerRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => borrowerService.rejectRequest(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "borrowerRequests"] });
      toast.success("Borrower request rejected");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to reject borrower request"),
  });
}
