"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { useState } from "react";
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";
import { WALLETCONNECT_PROJECT_ID } from "@/constants/chains";
import { cn } from "@/lib/utils";

type Tab = "connect" | "account";

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isAuthenticated, logout: storeLogout } = useAuthStore();
  const { login, logout, isSigningIn, isSigningOut } = useSIWE();
  const [open, setOpen] = useState(false);

  function handleCopy() {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied");
    }
  }

  async function handleSignIn() {
    try {
      await login();
      setOpen(false);
    } catch {
      // error handled in hook
    }
  }

  async function handleDisconnect() {
    await logout();
    disconnect();
    setOpen(false);
  }

  if (isConnected && address) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="mono text-xs hidden sm:block">{formatAddress(address)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" />
        </button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent title="Connected Account" className="max-w-sm">
            <div className="p-6 pt-4 space-y-5">
              <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-4">
                <div className="h-10 w-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface-variant mb-0.5">Connected Wallet</p>
                  <p className="text-sm font-mono text-on-surface truncate">{address}</p>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                  <p className="text-xs text-amber-400">
                    Sign a message to authenticate with RevvFi
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {!isAuthenticated ? (
                  <Button
                    onClick={handleSignIn}
                    loading={isSigningIn}
                    className="w-full"
                  >
                    Sign In with Ethereum
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Authenticated</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopy} className="flex-1 gap-1.5">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    loading={isSigningOut}
                    className="flex-1 gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="md" className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Connect Wallet" description="Connect your wallet to access RevvFi">
          <div className="p-6 pt-4 space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                disabled={isPending}
                onClick={() => {
                  connect({ connector });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <WalletIcon name={connector.name} />
                <span className="font-medium">{connector.name}</span>
                {isPending && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </button>
            ))}

            <p className="text-xs text-on-surface-variant text-center pt-2">
              By connecting, you agree to RevvFi&apos;s Terms of Service
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WalletIcon({ name }: { name: string }) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("metamask")) {
    return (
      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-xs">
        M
      </div>
    );
  }
  if (nameLower.includes("coinbase")) {
    return (
      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
        C
      </div>
    );
  }
  if (nameLower.includes("walletconnect")) {
    return (
      <div className="h-8 w-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary font-bold text-xs">
        W
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
      <Wallet className="h-4 w-4 text-on-surface-variant" />
    </div>
  );
}
