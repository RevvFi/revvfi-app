"use client";

import { Search, Bell, Globe } from "lucide-react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { useUIStore } from "@/store/ui.store";

export function Header() {
  const { openCommandPalette } = useUIStore();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 gap-4">
      {/* Search */}
      <button
        onClick={openCommandPalette}
        className="flex flex-1 max-w-xs items-center gap-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant hover:border-secondary-container hover:text-on-surface transition-colors"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:block">Search markets, assets…</span>
        <kbd className="ml-auto hidden sm:flex items-center gap-1 rounded border border-outline-variant px-1.5 py-0.5 text-[10px] text-on-surface-variant/50">
          ⌘K
        </kbd>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Network indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-low px-3 py-1.5 text-[11px] text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <Globe className="h-3 w-3" />
          <span>Ethereum Mainnet</span>
        </div>

        {/* Notifications */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-md border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-secondary-container transition-colors">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary-container" />
        </button>

        <ConnectWalletButton />
      </div>
    </header>
  );
}
