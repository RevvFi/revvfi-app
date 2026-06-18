"use client";

import { Search, Bell, Globe } from "lucide-react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { useUIStore } from "@/store/ui.store";
import { Button } from "@/components/ui/button";

export function Header() {
  const { openCommandPalette } = useUIStore();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur px-4 gap-4">
      {/* Search */}
      <button
        onClick={openCommandPalette}
        className="flex flex-1 max-w-sm items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm text-on-surface-variant hover:border-outline-variant/60 transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden sm:block">Search markets, assets...</span>
        <kbd className="ml-auto hidden sm:flex items-center gap-1 rounded border border-outline-variant/30 px-1.5 py-0.5 text-xs text-on-surface-variant/60">
          ⌘K
        </kbd>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Network indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <Globe className="h-3.5 w-3.5" />
          <span>Ethereum Mainnet</span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-container" />
        </Button>

        <ConnectWalletButton />
      </div>
    </header>
  );
}
