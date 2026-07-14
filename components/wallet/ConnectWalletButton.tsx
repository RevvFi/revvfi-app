"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useState } from "react";
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePositions";
import { formatAddress, fmtUSD } from "@/lib/utils";
import { WalletPickerDialog } from "./WalletPickerDialog";

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
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
          className="flex items-center gap-2 h-8 px-3 rounded-full border border-outline-variant hover:border-outline transition-colors text-[12px] text-on-surface bg-background"
        >
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF6A00]/40 shrink-0" />
          <span className="font-mono hidden sm:block">{formatAddress(address)}</span>
          <ChevronDown className="h-3 w-3 text-on-surface-variant" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-56 z-50 rounded-xl border border-outline-variant/30 bg-surface-container shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-outline-variant/20">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                  onClick={() => { setDropdownOpen(false); window.location.href = "/portfolio"; }}
                >
                  <Wallet className="h-3.5 w-3.5" /> Portfolio
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                  onClick={() => { setDropdownOpen(false); window.location.href = "/settings"; }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Settings
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                  onClick={() => { setDropdownOpen(false); handleCopy(); }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Address
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors"
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
      {/* Connect button — rounded-full, orange gradient */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.97] select-none"
        style={{
          background: "linear-gradient(135deg, #FF8C47 0%, #FF6A00 50%, #E55F00 100%)",
          boxShadow: "0 4px 16px rgba(255,106,0,0.30), 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      >
        <Wallet className="h-4 w-4" />
        Connect
      </button>

      <WalletPickerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
