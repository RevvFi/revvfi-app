"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MeResponse } from "@/types";

interface AuthState {
  token: string | null;
  user: MeResponse | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: MeResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("revvfi_jwt", token);
        }
        set({ token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("revvfi_jwt");
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "revvfi_auth",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
