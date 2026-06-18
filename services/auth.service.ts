import { get, post } from "@/lib/api";
import type { LoginRequest, LoginResponse, MeResponse, NonceRequest, NonceResponse } from "@/types";

export const authService = {
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    return post<NonceResponse>("/auth/nonce", { wallet_address: walletAddress } satisfies NonceRequest);
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    return post<LoginResponse>("/auth/login", payload);
  },

  async logout(): Promise<{ message: string }> {
    return post<{ message: string }>("/auth/logout");
  },

  async me(): Promise<MeResponse> {
    return get<MeResponse>("/auth/me");
  },
};
