"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { Settings, Menu, X } from "lucide-react";
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
      ? "text-[#FF6A00] border-[#FF6A00]"
      : "text-[#9CA3AF] border-transparent hover:text-[#E6E6E6]"
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

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
        className="flex h-16 shrink-0 items-stretch border-b border-[#1A1A1A] bg-[#0A0A0A]"
        style={{ zIndex: 50 }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 border-r border-[#1A1A1A] shrink-0 hover:bg-white/[0.02] transition-colors"
        >
          <Image
            src="/favicon-96x96.png"
            alt="RevvFi"
            width={28}
            height={28}
            className="rounded-sm"
            priority
          />
          <span className="text-sm font-bold text-[#E6E6E6] tracking-tight select-none hidden sm:block">
            Revv<span className="text-[#FF6A00]">Fi</span>
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
        <div className="flex items-center gap-1 px-3 ml-auto border-l border-[#1A1A1A] shrink-0">
          {/* Network pill — large screens only */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-7 rounded border border-[#1A1A1A] text-[11px] font-medium text-[#9CA3AF] select-none mr-1">
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
                ? "text-[#FF6A00]"
                : "text-[#9CA3AF] hover:text-[#E6E6E6]"
            )}
          >
            <Settings className="h-3.75 w-3.75" />
          </Link>

          {/* Wallet */}
          <ConnectWalletButton />

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden ml-1 h-8 w-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#E6E6E6] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-[#0A0A0A] md:hidden overflow-y-auto"
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
                    ? "text-[#FF6A00] bg-[#FF6A00]/5 border-l-2 border-l-[#FF6A00]"
                    : "text-[#9CA3AF] hover:text-[#E6E6E6] hover:bg-white/3"
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
                  ? "text-[#FF6A00] bg-[#FF6A00]/5 border-l-2 border-l-[#FF6A00]"
                  : "text-[#9CA3AF] hover:text-[#E6E6E6] hover:bg-white/3"
              )}
            >
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-2 px-6 py-4 text-[12px] text-[#9CA3AF] border-t border-[#1A1A1A] mt-2">
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
