"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { queryKeys } from "@/constants/query-keys";
import { localChain } from "@/constants/chains";

export function useAuthSession() {
  const { token } = useAuthStore();
  const { setUser, logout: storeLogout } = useAuthStore();

  const { data: me, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authService.me,
    enabled: !!token,
    retry: 1,
    // If 401 is returned, clear the token
    throwOnError: false,
  });

  // Must run in an effect, not directly in the render body: calling a
  // zustand setter unconditionally on every render re-triggers a state
  // update -> re-render -> setter call again, an infinite loop. This was
  // previously harmless because useAuthSession was never actually mounted
  // anywhere; wiring it into AuthWalletSync (global) turned this into a
  // page-hanging infinite render loop the moment a wallet connects.
  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);

  return { me, isLoading };
}

export function useSIWE() {
  const { address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();
  const { setToken, setUser, logout: storeLogout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected");

      // 1. Get nonce from backend
      const nonceResp = await authService.getNonce(address);

      // 2. Build SIWE message
      const siweMsg = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to RevvFi Institutional DeFi Platform",
        uri: window.location.origin,
        version: "1",
        chainId: chain?.id ?? localChain.id,
        nonce: nonceResp.nonce,
      });
      const message = siweMsg.prepareMessage();

      // 3. Sign the message
      const signature = await signMessageAsync({ message });

      // 4. Login with backend
      const loginResp = await authService.login({
        wallet_address: address,
        message,
        signature,
        nonce: nonceResp.nonce,
      });

      return loginResp;
    },
    onSuccess: async (data) => {
      setToken(data.token);
      // Fetch user profile
      try {
        const me = await authService.me();
        setUser(me);
      } catch {
        // ok, we still have the token
      }
      await qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Signed in successfully");
    },
    onError: (err: Error) => {
      if (err.message.includes("User rejected")) {
        toast.error("Signature rejected");
      } else {
        toast.error(err.message ?? "Sign-in failed");
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch {
        // ignore backend error, still clear local state
      }
    },
    onSuccess: () => {
      storeLogout();
      qc.clear();
      toast.success("Signed out");
    },
  });

  return {
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isSigningIn: loginMutation.isPending,
    isSigningOut: logoutMutation.isPending,
  };
}
