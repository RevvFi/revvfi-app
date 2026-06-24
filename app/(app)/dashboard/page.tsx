"use client";

import { useAccount } from "wagmi";
import { usePortfolio, usePositions } from "@/hooks/usePositions";
import { useMarkets } from "@/hooks/useMarkets";
import { useLiquidations } from "@/hooks/useAuctions";
import { useBorrower } from "@/hooks/useBorrower";
import { Card, MetricCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatAddress, formatAPR, formatTimestamp, statusColor } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, Activity, Wallet, Shield } from "lucide-react";

const CHART_COLORS = ["#ff5a1f", "#8ecdff", "#ffb68d", "#4ade80"];

const MOCK_PERF = [
  { day: "Mon", value: 1200000 }, { day: "Tue", value: 1240000 },
  { day: "Wed", value: 1210000 }, { day: "Thu", value: 1280000 },
  { day: "Fri", value: 1350000 }, { day: "Sat", value: 1320000 },
  { day: "Sun", value: 1284592 },
];

export default function DashboardPage() {
  const { address } = useAccount();
  const { user, isAuthenticated } = useAuthStore();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: positions, isLoading: positionsLoading } = usePositions({ limit: 5 });
  const { data: markets } = useMarkets({ is_active: true });
  const { data: liquidations } = useLiquidations();
  const { data: borrower } = useBorrower(address ?? "");

  const totalValue = portfolio?.total_value ?? "0";
  const activePositions = portfolio?.active_positions ?? 0;
  const avgAPR = portfolio?.avg_apr ?? 0;
  const earnedInterest = portfolio?.earned_interest ?? "0";

  const allocationData = [
    { name: "Active", value: activePositions || 1 },
    { name: "Settled", value: portfolio?.settled_positions || 0 },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      {/* Page header */}
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

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} rows={1} />)
        ) : (
          <>
            <MetricCard
              label="Total Value"
              value={`$${(parseFloat(totalValue) / 1e6).toFixed(2)}M`}
              trend={{ value: "+4.2% this month", positive: true }}
              sub="Across all positions"
            />
            <MetricCard
              label="Active Positions"
              value={activePositions}
              sub={`${portfolio?.settled_positions ?? 0} settled`}
            />
            <MetricCard
              label="Avg. APR"
              value={`${(avgAPR / 100).toFixed(2)}%`}
              trend={{ value: "0.8% above market", positive: true }}
            />
            <MetricCard
              label="Earned Interest"
              value={`$${(parseFloat(earnedInterest) / 1e6).toFixed(4)}`}
              sub="Accrued to date"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Portfolio Performance
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">Cumulative value over time</p>
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

        {/* Reputation / Allocation */}
        <div className="space-y-4">
          {borrower ? (
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Reputation Score
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ v: borrower.reputation_score }, { v: 1000 - borrower.reputation_score }]}
                        cx="50%" cy="50%" innerRadius={22} outerRadius={30} dataKey="v" startAngle={90} endAngle={-270}>
                        <Cell fill="#ff5a1f" />
                        <Cell fill="#43312b" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                    {borrower.reputation_score}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface">{borrower.risk_label}</p>
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
                Reputation Score
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-outline-variant/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Not registered as borrower</p>
                  <Link href="/borrow" className="text-xs text-primary hover:underline mt-1 block">
                    Register now →
                  </Link>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
              Asset Allocation
            </p>
            <div className="space-y-2">
              {[
                { label: "Stablecoins", pct: 54, color: "#ff5a1f" },
                { label: "Majors (BTC/ETH)", pct: 32, color: "#8ecdff" },
                { label: "Altcoins", pct: 10, color: "#ffb68d" },
                { label: "Liquidity", pct: 4, color: "#4ade80" },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-24 text-xs text-on-surface-variant truncate">{label}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-outline-variant/20">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-xs text-on-surface-variant w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Positions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Positions */}
        <Card>
          <div className="flex items-center justify-between p-5 pb-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Active Positions
            </p>
            <Link href="/portfolio" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 pt-3 space-y-3">
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
                <div key={pos.token_id} className="flex items-center gap-3 py-2 border-b border-outline-variant/10 last:border-0">
                  <div className="h-8 w-8 rounded-lg bg-primary-container/15 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">Token #{pos.token_id}</p>
                    <p className="text-xs text-on-surface-variant mono">{formatAddress(pos.market_address)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-on-surface mono">{formatAPR(pos.apr)}</p>
                    <StatusBadge status={pos.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant py-6 text-center">No active positions</p>
            )}
          </div>
        </Card>

        {/* Market Overview */}
        <Card>
          <div className="flex items-center justify-between p-5 pb-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Market Overview
            </p>
            <Link href="/markets" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-xs text-on-surface-variant mb-1">Active Markets</p>
                <p className="text-xl font-bold text-on-surface">{markets?.count ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-xs text-on-surface-variant mb-1">Liquidating</p>
                <p className="text-xl font-bold text-orange-400">{liquidations?.count ?? 0}</p>
              </div>
            </div>
            {markets?.markets.slice(0, 3).map((m) => (
              <Link
                key={m.address}
                href={`/markets/${m.address}`}
                className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-0 hover:bg-white/[0.02] -mx-1 px-1 rounded transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {m.borrow_asset.symbol || formatAddress(m.borrow_asset.address, 4)} /&nbsp;
                    {m.collateral_asset.symbol || formatAddress(m.collateral_asset.address, 4)}
                  </p>
                  <p className="text-xs text-on-surface-variant mono">{formatAddress(m.borrower)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm mono text-on-surface">{(m.utilization_rate * 100).toFixed(1)}%</p>
                  <p className="text-xs text-on-surface-variant">Utilization</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
