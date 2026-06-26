"use client";

import { useAccount } from "wagmi";
import { usePortfolio, usePositions } from "@/hooks/usePositions";
import { useMarkets } from "@/hooks/useMarkets";
import { useLiquidations } from "@/hooks/useAuctions";
import { useBorrower, useBorrowerRisk } from "@/hooks/useBorrower";
import { Card, MetricCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HealthFactorRing } from "@/components/HealthFactorRing";
import { TokenPair } from "@/components/TokenIcon";
import { formatAddress, formatAPR, fmtUSD, reputationColor } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, Activity, Wallet, Shield, Zap, LayoutDashboard } from "lucide-react";

const MOCK_PERF = [
  { day: "Mon", value: 1200000 }, { day: "Tue", value: 1240000 },
  { day: "Wed", value: 1210000 }, { day: "Thu", value: 1280000 },
  { day: "Fri", value: 1350000 }, { day: "Sat", value: 1320000 },
  { day: "Sun", value: 1284592 },
];

export default function DashboardPage() {
  const { address } = useAccount();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: positions, isLoading: positionsLoading } = usePositions({ limit: 5 });
  const { data: markets } = useMarkets({ is_active: true });
  const { data: liquidations } = useLiquidations();
  const { data: borrower } = useBorrower(address ?? "");
  const { data: risk } = useBorrowerRisk(address ?? "");

  const totalValue      = portfolio?.total_value ?? "0";
  const activePositions = portfolio?.active_positions ?? 0;
  const avgAPR          = portfolio?.avg_apr ?? 0;
  const earnedInterest  = portfolio?.earned_interest ?? "0";

  const outstandingDebt = borrower
    ? (parseFloat(borrower.total_borrowed) - parseFloat(borrower.total_repaid))
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
            Portfolio Overview
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Real-time performance metrics for your institutional assets
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm">Export Data</Button>
          <Button variant="secondary" size="sm">Manage Alerts</Button>
        </div>
      </div>

      {/* ── Borrower health banner (only when registered) ──────────────── */}
      {borrower && (
        <Card className="p-4 sm:p-5 border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Ring + label */}
            <div className="flex items-center gap-4 shrink-0">
              <HealthFactorRing value={risk?.health_factor ?? 0} size="sm" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Health Factor</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Liquidation threshold: 1.10</p>
              </div>
            </div>

            {/* Debt stats */}
            <div className="flex flex-wrap gap-4 sm:gap-6 flex-1">
              <div>
                <p className="text-xs text-on-surface-variant">Total Borrowed</p>
                <p className="text-base font-bold mono text-on-surface">{fmtUSD(borrower.total_borrowed)}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Outstanding Debt</p>
                <p className="text-base font-bold mono text-on-surface">
                  {outstandingDebt > 0 ? fmtUSD(outstandingDebt.toString(), 0) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Active Loans</p>
                <p className="text-base font-bold mono text-on-surface">{borrower.active_loans || "0"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Reputation</p>
                <p className={`text-base font-bold mono ${reputationColor(borrower.reputation_score)}`}>
                  {borrower.reputation_score}
                </p>
              </div>
            </div>

            {/* CTA */}
            <Link href="/borrow" className="shrink-0 w-full sm:w-auto">
              <Button size="sm" className="gap-1.5 w-full sm:w-auto">
                <Zap className="h-3.5 w-3.5" /> Borrow Portal
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ── Top metrics ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {portfolioLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} rows={1} />)
        ) : (
          <>
            <MetricCard
              label="Total Value"
              value={fmtUSD(totalValue)}
              sub="Across all positions"
            />
            <MetricCard
              label="Active Positions"
              value={activePositions > 0 ? activePositions : "—"}
              sub={portfolio?.settled_positions ? `${portfolio.settled_positions} settled` : undefined}
            />
            <MetricCard
              label="Avg. APR"
              value={avgAPR > 0 ? formatAPR(avgAPR) : "—"}
            />
            <MetricCard
              label="Earned Interest"
              value={fmtUSD(earnedInterest)}
              sub="Accrued to date"
            />
          </>
        )}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Performance Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Portfolio Performance
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">Illustrative — live data connected once positions are active</p>
            </div>
            <div className="flex gap-1">
              {["1D", "1W", "1M", "1Y"].map((t) => (
                <button
                  key={t}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${t === "1W" ? "bg-primary-container/20 text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_PERF} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fadcd4" }}
                formatter={(v: number) => [`$${(v / 1e6).toFixed(3)}M`, "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="#ff5a1f" strokeWidth={2} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Right column: Reputation + Quick Actions */}
        <div className="space-y-4">
          {/* Reputation card */}
          {borrower ? (
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Reputation Score
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ v: borrower.reputation_score }, { v: Math.max(0, 1000 - borrower.reputation_score) }]}
                        cx="50%" cy="50%" innerRadius={20} outerRadius={28}
                        dataKey="v" startAngle={90} endAngle={-270}
                      >
                        <Cell fill="#ff5a1f" />
                        <Cell fill="#43312b" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                    {borrower.reputation_score}
                  </span>
                </div>
                <div>
                  <p className={`text-base font-bold ${reputationColor(borrower.reputation_score)}`}>
                    {borrower.risk_label}
                  </p>
                  <p className="text-xs text-on-surface-variant">Institutional tier</p>
                  <Link href="/reputation" className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                    View details <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Borrower Status
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-outline-variant/20 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-sm text-on-surface">Not registered as borrower</p>
                  <Link href="/borrow" className="text-xs text-primary hover:underline mt-1 block">
                    Register to access borrowing →
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
              Quick Actions
            </p>
            <div className="space-y-1">
              {[
                { label: "Browse Markets",  desc: "Find markets to lend in",   href: "/markets",   Icon: TrendingUp   },
                { label: "Borrow Portal",   desc: "Manage your debt",          href: "/borrow",    Icon: Zap          },
                { label: "Lend Capital",    desc: "Create offers for borrowers",href: "/lend",      Icon: Wallet       },
                { label: "View Portfolio",  desc: "Track all positions",        href: "/portfolio", Icon: Activity     },
              ].map(({ label, desc, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="h-7 w-7 rounded-md bg-primary-container/10 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary-container" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-[10px] text-on-surface-variant">{desc}</p>
                  </div>
                  <ArrowUpRight className="h-3 w-3 text-on-surface-variant/30 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Positions & Markets ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Active Positions */}
        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Active Positions
            </p>
            <Link href="/portfolio" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-5 pb-5 space-y-2">
            {positionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))
            ) : positions?.positions.length ? (
              positions.positions.slice(0, 5).map((pos) => (
                <div key={pos.token_id} className="flex items-center gap-3 py-2.5 border-b border-outline-variant/10 last:border-0">
                  <div className="h-8 w-8 rounded-lg bg-primary-container/15 flex items-center justify-center shrink-0">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">Token #{pos.token_id}</p>
                    <p className="text-xs text-on-surface-variant mono">{formatAddress(pos.market_address)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-primary mono">{formatAPR(pos.apr)}</p>
                    <StatusBadge status={pos.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <LayoutDashboard className="h-8 w-8 text-on-surface-variant/30" />
                <p className="text-sm text-on-surface-variant">No active positions</p>
                <Link href="/lend" className="text-xs text-primary hover:underline">Create your first offer →</Link>
              </div>
            )}
          </div>
        </Card>

        {/* Market Overview */}
        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Market Overview
            </p>
            <Link href="/markets" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-xs text-on-surface-variant mb-1">Active Markets</p>
                <p className="text-xl font-bold text-on-surface">{markets?.count ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-xs text-on-surface-variant mb-1">Liquidating</p>
                <p className={`text-xl font-bold ${(liquidations?.count ?? 0) > 0 ? "text-orange-400" : "text-on-surface"}`}>
                  {liquidations?.count ?? 0}
                </p>
              </div>
            </div>
            {markets?.markets.length ? (
              markets.markets.slice(0, 3).map((m) => (
                <Link
                  key={m.address}
                  href={`/markets/${m.address}`}
                  className="flex items-center justify-between py-2.5 border-b border-outline-variant/10 last:border-0 hover:bg-white/[0.02] -mx-1 px-1 rounded transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TokenPair from={m.collateral_asset.symbol} to={m.borrow_asset.symbol} size="xs" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {m.collateral_asset.symbol} → {m.borrow_asset.symbol}
                      </p>
                      <p className="text-xs text-on-surface-variant mono">{formatAddress(m.borrower)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm mono font-semibold text-primary">{formatAPR(m.weighted_apr)}</p>
                    <p className="text-[10px] text-on-surface-variant">{(m.utilization_rate * 100).toFixed(1)}% util</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant py-4 text-center">No active markets</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
