"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search, TrendingUp, Gavel, Wallet, Settings,
  BarChart2, Coins, ShieldCheck, LayoutDashboard,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: TrendingUp },
  { label: "Borrow", href: "/borrow", icon: Coins },
  { label: "Lend", href: "/lend", icon: BarChart2 },
  { label: "Liquidation Auctions", href: "/auctions", icon: Gavel },
  { label: "Portfolio", href: "/portfolio", icon: Wallet },
  { label: "Reputation", href: "/reputation", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="rounded-xl border border-outline-variant/30 bg-surface-container-high/90 backdrop-blur-xl shadow-2xl overflow-hidden"
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-outline-variant/20">
            <Search className="h-4 w-4 text-on-surface-variant shrink-0" />
            <Command.Input
              placeholder="Search pages, markets, actions…"
              className="flex-1 py-4 bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/60"
              autoFocus
            />
            <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-outline-variant/30 px-1.5 py-0.5 text-[10px] text-on-surface-variant">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-on-surface-variant">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-on-surface-variant/60 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                <Command.Item
                  key={href}
                  value={label}
                  onSelect={() => navigate(href)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-on-surface-variant cursor-pointer transition-colors aria-selected:bg-surface-container aria-selected:text-on-surface"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-outline-variant/20 px-4 py-2 flex items-center gap-4 text-[10px] text-on-surface-variant/60">
            <span><kbd className="rounded border border-outline-variant/30 px-1 py-0.5">↑↓</kbd> navigate</span>
            <span><kbd className="rounded border border-outline-variant/30 px-1 py-0.5">↵</kbd> select</span>
            <span><kbd className="rounded border border-outline-variant/30 px-1 py-0.5">ESC</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
