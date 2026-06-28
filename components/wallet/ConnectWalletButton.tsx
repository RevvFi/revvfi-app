"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePositions";
import { formatAddress, fmtUSD } from "@/lib/utils";

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isAuthenticated } = useAuthStore();
  const { login, logout } = useSIWE();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: portfolio } = usePortfolio();

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
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 h-8 px-3 rounded border border-outline-variant hover:border-[#2D2D2D] transition-colors text-[12px] text-on-surface bg-background"
        >
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF6A00]/40 shrink-0" />
          <span className="font-mono hidden sm:block">{formatAddress(address)}</span>
          <ChevronDown className="h-3 w-3 text-on-surface-variant" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-56 z-50 rounded-lg border border-outline-variant bg-surface-container shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-outline-variant">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF6A00]/40 shrink-0" />
                  <div>
                    <p className="text-[12px] font-mono text-on-surface">{formatAddress(address)}</p>
                    <p className="text-[10px] text-on-surface-variant">Ethereum</p>
                  </div>
                </div>
                {portfolio && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Portfolio</span>
                      <span className="font-semibold text-on-surface mono">{fmtUSD(portfolio.total_value)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Positions</span>
                      <span className="font-semibold text-on-surface">{portfolio.active_positions}</span>
                    </div>
                  </div>
                )}
                {!isAuthenticated && (
                  <div className="mt-2">
                    <button
                      className="w-full text-[11px] text-amber-400 hover:text-amber-300 transition-colors text-left"
                      onClick={() => { setDropdownOpen(false); handleSignIn(); }}
                    >
                      Sign in with Ethereum →
                    </button>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="p-1">
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                  onClick={() => { setDropdownOpen(false); window.location.href = "/portfolio"; }}
                >
                  <Wallet className="h-3.5 w-3.5" /> Portfolio
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                  onClick={() => { setDropdownOpen(false); window.location.href = "/settings"; }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Settings
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                  onClick={() => { setDropdownOpen(false); handleCopy(); }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Address
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-[12px] text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors"
                  onClick={() => { setDropdownOpen(false); handleDisconnect(); }}
                >
                  <LogOut className="h-3.5 w-3.5" /> Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
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
            {connectors
              .filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i)
              .map((connector) => (
              <button
                key={connector.id}
                disabled={isPending}
                onClick={() => {
                  setOpen(false);
                  connect({ connector }, {
                    onSuccess: () => { if (!isAuthenticated) login(); },
                  });
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
