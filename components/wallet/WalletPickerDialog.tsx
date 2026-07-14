"use client";

import { useState } from "react";
import Image from "next/image";
import { useConnect } from "wagmi";
import { HelpCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { markExplicitConnectIntent } from "@/lib/connect-intent";

const RECENT_KEY = "revvfi-recent-connector";

export function WalletPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { connect, connectors, isPending } = useConnect();
  const [recentId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(RECENT_KEY) : null
  );

  function handleConnect(connector: (typeof connectors)[number]) {
    localStorage.setItem(RECENT_KEY, connector.id);
    markExplicitConnectIntent();
    connect(
      { connector },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => toast.error(error.message || "Could not connect wallet"),
      }
    );
  }

  // Deduplicate connectors by name
  const unique = connectors.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);
  // Featured = injected / MetaMask first; rest go in the list
  const featured = unique.find((c) => c.type === "injected" || c.name.toLowerCase().includes("metamask")) ?? unique[0];
  const rest = unique.filter((c) => c.id !== featured?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-100 p-0 overflow-hidden border-outline-variant/20">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-on-surface">Connect Wallet</h2>
          {/* spacer to balance the ? icon — X is rendered by DialogContent */}
          <div className="w-5" />
        </div>

        <div className="px-4 pb-4 space-y-3">
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

          {rest.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-outline-variant/25" />
              <span className="text-[11px] text-on-surface-variant whitespace-nowrap">
                or select a wallet from the list below
              </span>
              <div className="flex-1 h-px bg-outline-variant/25" />
            </div>
          )}

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

        <div className="px-4 pb-5 pt-1 flex justify-center border-t border-outline-variant/10">
          <button className="flex items-center gap-2 text-[12px] text-on-surface-variant hover:text-on-surface transition-colors mt-3">
            <CreditCard className="h-4 w-4" />
            I don&apos;t have a wallet
          </button>
        </div>
      </DialogContent>
    </Dialog>
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
