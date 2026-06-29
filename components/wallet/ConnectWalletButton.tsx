"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, HelpCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePositions";
import { formatAddress, fmtUSD } from "@/lib/utils";

const RECENT_KEY = "revvfi-recent-connector";

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isAuthenticated } = useAuthStore();
  const { login, logout } = useSIWE();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentId, setRecentId] = useState<string | null>(null);
  const { data: portfolio } = usePortfolio();

  useEffect(() => {
    setRecentId(localStorage.getItem(RECENT_KEY));
  }, [open]);

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

  function handleConnect(connector: (typeof connectors)[number]) {
    localStorage.setItem(RECENT_KEY, connector.id);
    setOpen(false);
    connect({ connector }, {
      onSuccess: () => { if (!isAuthenticated) login(); },
    });
  }

  // Deduplicate connectors by name
  const unique = connectors.filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i);
  // Featured = injected / MetaMask first; rest go in the list
  const featured = unique.find(c => c.type === "injected" || c.name.toLowerCase().includes("metamask")) ?? unique[0];
  const rest = unique.filter(c => c.id !== featured?.id);

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-100 p-0 overflow-hidden border-outline-variant/20">
          {/* Custom header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold text-on-surface">Connect Wallet</h2>
            {/* spacer to balance the ? icon — X is rendered by DialogContent */}
            <div className="w-5" />
          </div>

          <div className="px-4 pb-4 space-y-3">
            {/* Featured connector — orange gradient pill */}
            {featured && (
              <button
                disabled={isPending}
                onClick={() => handleConnect(featured)}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #FF8C47 0%, #FF6A00 55%, #E55F00 100%)",
                  boxShadow: "0 4px 20px rgba(255,106,0,0.28)",
                }}
              >
                <ConnectorIcon connector={featured} size={22} className="rounded-md" />
                Continue with {featured.name}
              </button>
            )}

            {/* Divider */}
            {rest.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-outline-variant/25" />
                <span className="text-[11px] text-on-surface-variant whitespace-nowrap">
                  or select a wallet from the list below
                </span>
                <div className="flex-1 h-px bg-outline-variant/25" />
              </div>
            )}

            {/* Remaining connectors */}
            <div className="space-y-2">
              {rest.map((connector) => (
                <button
                  key={connector.id}
                  disabled={isPending}
                  onClick={() => handleConnect(connector)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface hover:bg-surface-container-high hover:border-outline-variant/40 transition-all disabled:opacity-50"
                >
                  <ConnectorIcon connector={connector} size={36} className="rounded-xl" />
                  <span className="font-medium">{connector.name}</span>
                  {connector.id === recentId && (
                    <span className="ml-auto text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full border border-outline-variant/20">
                      Recent
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 pt-1 flex justify-center border-t border-outline-variant/10">
            <button className="flex items-center gap-2 text-[12px] text-on-surface-variant hover:text-on-surface transition-colors mt-3">
              <CreditCard className="h-4 w-4" />
              I don&apos;t have a wallet
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const WALLET_ICONS: Record<string, string> = {
  metamask: "/metamask.svg",
  coinbase: "/coinbase.svg",
  phantom: "/Phantom.svg",
};

function ConnectorIcon({
  connector,
  size,
  className = "",
}: {
  connector: { name: string; icon?: string };
  size: number;
  className?: string;
}) {
  const n = connector.name.toLowerCase();
  const src = Object.entries(WALLET_ICONS).find(([key]) => n.includes(key))?.[1];

  if (src) {
    return (
      <Image
        src={src}
        alt={connector.name}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: "contain" }}
        priority
      />
    );
  }

  // Generic fallback for unknown connectors
  return (
    <div
      className={`bg-white/10 ${className} flex items-center justify-center font-bold text-on-surface`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {connector.name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
