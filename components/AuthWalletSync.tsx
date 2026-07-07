"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAuthStore } from "@/store/auth.store";
import { useAuthSession, useSIWE } from "@/hooks/useAuth";
import { consumeExplicitConnectIntent } from "@/lib/connect-intent";

/**
 * Keeps the SIWE session in sync with the actively connected wallet.
 *
 * Without this, switching MetaMask accounts leaves the previous wallet's JWT
 * sitting in localStorage — apiClient keeps attaching it to every request,
 * so all authenticated calls (admin checks, borrower requests, portfolio,
 * etc.) silently act as the OLD wallet while the UI shows the NEW address as
 * connected. That produces exactly the confusing "I'm the admin but I can't
 * see admin data" symptom: the backend is correctly checking the stale
 * wallet from the token, not the one currently active in the browser.
 *
 * Mounted once near the root so every page benefits automatically.
 */
export function AuthWalletSync() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { login } = useSIWE();
  useAuthSession(); // refreshes `user` from /auth/me whenever a token exists

  useEffect(() => {
    if (!address || !isAuthenticated || !user?.wallet_address) return;
    if (user.wallet_address.toLowerCase() !== address.toLowerCase()) {
      logout();
    }
  }, [address, isAuthenticated, user, logout]);

  // Auto sign-in the moment a wallet freshly connects (a disconnected ->
  // connected transition within this session). Every individual "Connect
  // Wallet" button used to try to trigger this itself via connect()'s
  // onSuccess callback, but that's unreliable for CTAs like WalletGate's
  // WalletPrompt: as soon as isConnected flips true, WalletGate swaps from
  // rendering WalletPrompt to its children, unmounting WalletPrompt before
  // its own onSuccess callback fires - so the sign-in prompt silently never
  // happened. Centralizing it here, in a component that's always mounted,
  // fixes that for every entry point at once.
  //
  // Gating on an explicit "user just clicked Connect" signal (not just
  // "isConnected && !isAuthenticated") is deliberate: it avoids popping a
  // signature prompt on every page load for a wallet that reconnected from
  // a previous session but whose token expired (handled instead by an
  // explicit, visible "Sign In" affordance on the page itself), and avoids
  // immediately re-prompting right after a deliberate logout() - which
  // clears the token but doesn't disconnect the wallet.
  //
  // This can't be done by watching wagmi's connection `status`
  // ('connecting' vs 'reconnecting') - verified live that on this wagmi
  // version, an automatic reconnect-from-a-previous-session on page load
  // ALSO passes through 'connecting' on its way to 'connected', identical
  // to an explicit connect() call, so status alone can't tell them apart.
  // Instead, the connect CTAs (wallet-gate.tsx, ConnectWalletButton.tsx)
  // mark connect-intent.ts's flag synchronously right when the user clicks,
  // before calling connect() - auto-reconnect on mount never touches that
  // flag, so it stays false for that case.
  useEffect(() => {
    if (isConnected && !isAuthenticated && consumeExplicitConnectIntent()) {
      login();
    }
  }, [isConnected, isAuthenticated, login]);

  return null;
}
