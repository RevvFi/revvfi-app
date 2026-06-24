"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import {
  LayoutDashboard, TrendingUp, ArrowDownLeft, ArrowUpRight,
  Gavel, Briefcase, Award, BarChart3, Settings, Plus,
  ShieldCheck, ChevronLeft, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets",   label: "Markets",   icon: TrendingUp },
  { href: "/borrow",    label: "Borrow",    icon: ArrowDownLeft },
  { href: "/lend",      label: "Lend",      icon: ArrowUpRight },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/auctions",  label: "Auctions",  icon: Gavel },
  { href: "/reputation",label: "Reputation",icon: Award },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-[#1a1a1a] bg-[#080808] transition-all duration-200",
        sidebarCollapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-14 items-center border-b border-[#1a1a1a]",
        sidebarCollapsed ? "justify-center px-0" : "gap-2.5 px-4"
      )}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          <Image
            src="/favicon-96x96.png"
            alt="RevvFi"
            width={28}
            height={28}
            className="rounded-sm"
            priority
          />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#e2e2e2] tracking-tight truncate">RevvFi</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[#555] truncate">Institutional</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-[#f15a24]/10 text-[#f15a24]"
                  : "text-[#666] hover:bg-white/[0.04] hover:text-[#c8c8c8]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#f15a24]" : "text-current")} />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            {!sidebarCollapsed && (
              <p className="px-2.5 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#444]">
                Admin
              </p>
            )}
            <Link
              href="/admin"
              title={sidebarCollapsed ? "Admin" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-[#f15a24]/10 text-[#f15a24]"
                  : "text-[#666] hover:bg-white/[0.04] hover:text-[#c8c8c8]"
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Admin Panel</span>}
            </Link>
          </>
        )}

        {/* System section */}
        {!sidebarCollapsed && (
          <p className="px-2.5 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#444]">
            System
          </p>
        )}
        <Link
          href="/settings"
          title={sidebarCollapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
            pathname === "/settings"
              ? "bg-[#f15a24]/10 text-[#f15a24]"
              : "text-[#666] hover:bg-white/[0.04] hover:text-[#c8c8c8]"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* Create Market CTA */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-[#1a1a1a]">
          <Link
            href="/markets/create"
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#f15a24] px-3 py-2 text-xs font-semibold text-white hover:bg-[#d94e1f] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Market
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-10 items-center justify-center border-t border-[#1a1a1a] text-[#444] hover:text-[#888] hover:bg-white/[0.03] transition-colors"
      >
        {sidebarCollapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
