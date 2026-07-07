"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "sonner";
import { wagmiConfig } from "./wagmi-config";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthWalletSync } from "@/components/AuthWalletSync";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Don't retry 4xx client errors (e.g. 404 "not a borrower") - the
        // request won't succeed on retry, it just triples request volume
        // and delays the UI settling into its "not found" state. Still
        // retry everything else (network errors, 5xx) up to twice.
        retry: (failureCount, error) => {
          const status = (error as { status?: number })?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AuthWalletSync />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#2c1c17",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fadcd4",
              },
            }}
          />
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
