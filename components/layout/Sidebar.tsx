"use client";

import Link from "next/link";
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
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/borrow", label: "Borrow", icon: ArrowDownLeft },
  { href: "/lend", label: "Lend", icon: ArrowUpRight },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/auctions", label: "Auctions", icon: Gavel },
  { href: "/reputation", label: "Reputation", icon: Award },
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
        "flex h-screen flex-col border-r border-outline-variant/20 bg-surface-container-lowest transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-outline-variant/20 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-container">
          <span className="text-xs font-black text-white">R</span>
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">RevvFi</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant truncate">Institutional</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-container/15 text-primary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            {!sidebarCollapsed && (
              <p className="px-2.5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
                Admin
              </p>
            )}
            <Link
              href="/admin"
              title={sidebarCollapsed ? "Admin" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-primary-container/15 text-primary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Admin Panel</span>}
            </Link>
          </>
        )}

        {/* Settings */}
        {!sidebarCollapsed && (
          <p className="px-2.5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
            System
          </p>
        )}
        <Link
          href="/settings"
          title={sidebarCollapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary-container/15 text-primary"
              : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* Create Market CTA */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-outline-variant/20">
          <Link
            href="/markets/create"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-container/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Market
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-10 items-center justify-center border-t border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
      >
        {sidebarCollapsed
          ? <ChevronRight className="h-4 w-4" />
          : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
