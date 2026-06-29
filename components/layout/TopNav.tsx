"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { Settings, Menu, X, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard"  },
  { href: "/markets",    label: "Markets"    },
  { href: "/borrow",     label: "Borrow"     },
  { href: "/lend",       label: "Lend"       },
  { href: "/portfolio",  label: "Portfolio"  },
  { href: "/auctions",   label: "Auctions"   },
  { href: "/reputation", label: "Reputation" },
  { href: "/analytics",  label: "Analytics"  },
];

// Shared link class builder
function navCls(active: boolean) {
  return cn(
    "flex items-center px-4 text-sm font-medium whitespace-nowrap",
    "border-b-2 transition-colors duration-150",
    active
      ? "text-primary border-[#FF6A00]"
      : "text-on-surface-variant border-transparent hover:text-on-surface"
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  function openSearch() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true })
    );
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const allNavItems = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header
        className="flex h-16 shrink-0 items-stretch border-b border-outline-variant bg-background"
        style={{ zIndex: 50 }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 shrink-0 hover:bg-surface-container transition-colors"
        >
          <Image
            src="/favicon-96x96.png"
            alt="RevvFi"
            width={28}
            height={28}
            className="rounded-sm"
            priority
          />
          <span className="text-sm font-bold text-on-surface tracking-tight select-none hidden sm:block">
            Revv<span className="text-primary">Fi</span>
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden md:flex items-stretch flex-1 overflow-x-auto">
          {allNavItems.map(({ href, label }) => (
            <Link key={href} href={href} className={navCls(isActive(href))}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1 px-3 ml-auto shrink-0">
          {/* ⌘K search trigger — desktop only */}
          <button
            onClick={openSearch}
            className="hidden lg:flex items-center gap-2 h-7 px-2.5 rounded border border-outline-variant text-[11px] text-on-surface-variant hover:text-on-surface hover:border-[#2D2D2D] transition-colors mr-1 select-none"
            title="Search (⌘K)"
          >
            <Search className="h-3 w-3" />
            <span>Search</span>
            <kbd className="rounded bg-outline-variant px-1 py-0.5 text-[10px]">⌘K</kbd>
          </button>

          {/* Network pill — large screens only */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-7 rounded border border-outline-variant text-[11px] font-medium text-on-surface-variant select-none mr-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa/128/color/eth.png"
              alt="ETH"
              width={14}
              height={14}
              className="rounded-full object-contain"
            />
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] pulse-dot" />
            Ethereum
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            title="Settings"
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded transition-colors",
              isActive("/settings")
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Settings className="h-3.75 w-3.75" />
          </Link>

          {/* Wallet */}
          <ConnectWalletButton />

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden ml-1 h-8 w-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-background md:hidden overflow-y-auto"
        >
          <nav className="flex flex-col">
            {allNavItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center h-13 px-6 text-[15px] font-medium border-b border-surface-container transition-colors",
                  isActive(href)
                    ? "text-primary bg-primary/5 border-l-2 border-l-primary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center h-13 px-6 text-[15px] font-medium border-b border-surface-container transition-colors",
                isActive("/settings")
                  ? "text-primary bg-primary/5 border-l-2 border-l-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              )}
            >
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-2 px-6 py-4 text-[12px] text-on-surface-variant border-t border-outline-variant mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa/128/color/eth.png"
              alt="ETH"
              width={14}
              height={14}
              className="rounded-full object-contain"
            />
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            Ethereum Mainnet
          </div>
        </div>
      )}
    </>
  );
}
