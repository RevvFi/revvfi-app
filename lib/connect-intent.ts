/**
 * A one-shot flag marking "the user just clicked a Connect Wallet button in
 * this tab", set by the various connect CTAs (wallet-gate.tsx,
 * ConnectWalletButton.tsx) and consumed by AuthWalletSync to decide whether
 * a freshly-connected wallet should get an automatic SIWE sign-in prompt.
 *
 * This exists because wagmi's own connection `status` can't reliably
 * distinguish an explicit connect() call from its automatic
 * reconnect-from-a-previous-session flow - both were observed to pass
 * through the same 'connecting' -> 'connected' sequence on this wagmi
 * version, so watching `status` alone caused an unwanted signature prompt
 * on every page load for a stale, logged-out-but-still-connected wallet.
 * A plain module-level flag sidesteps that entirely: only a real user click
 * sets it, auto-reconnect on mount never does.
 */
let intent = false;

export function markExplicitConnectIntent() {
  intent = true;
}

export function consumeExplicitConnectIntent(): boolean {
  const was = intent;
  intent = false;
  return was;
}
