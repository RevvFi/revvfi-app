"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { queryKeys } from "@/constants/query-keys";
import { useMarkets } from "@/hooks/useMarkets";
import { useLiquidations } from "@/hooks/useAuctions";
import { Card, MetricCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TVL_DATA = [
  { month: "Jan", tvl: 0.8 }, { month: "Feb", tvl: 1.1 }, { month: "Mar", tvl: 0.9 },
  { month: "Apr", tvl: 1.4 }, { month: "May", tvl: 1.2 }, { month: "Jun", tvl: 1.42 },
];
const VOL_DATA = [
  { month: "Jan", vol: 42 }, { month: "Feb", vol: 58 }, { month: "Mar", vol: 51 },
  { month: "Apr", vol: 67 }, { month: "May", vol: 72 }, { month: "Jun", vol: 84.5 },
];
const COLORS = ["#ff5a1f", "#8ecdff", "#ffb68d", "#4ade80", "#a78bfa"];

export default function AnalyticsPage() {
  const { data: markets } = useMarkets();
  const { data: liquidations } = useLiquidations();
  const { data: overview } = useQuery({
    queryKey: queryKeys.admin.statsOverview,
    queryFn: adminService.getStatsOverview,
  });
  const { data: statsLiq } = useQuery({
    queryKey: queryKeys.admin.statsLiquidations,
    queryFn: adminService.getStatsLiquidations,
  });
  const { data: statsPos } = useQuery({
    queryKey: queryKeys.admin.statsPositions,
    queryFn: adminService.getStatsPositions,
  });
  const { data: statsRev } = useQuery({
    queryKey: queryKeys.admin.statsRevenue,
    queryFn: adminService.getStatsRevenue,
  });

  const ov = overview?.data;
  const liq = statsLiq?.data;
  const pos = statsPos?.data;
  const rev = statsRev?.data;

  const positionDist = pos ? [
    { name: "Senior", value: pos.senior_positions },
    { name: "Junior", value: pos.junior_positions },
    { name: "Settled", value: pos.settled_positions },
  ] : [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Analytics</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Protocol-wide performance metrics and historical trends</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Value Locked" value="$1.42B" trend={{ value: "+13.5% vs last week", positive: true }} sub="Across all markets" />
        <MetricCard label="Active Markets" value={ov?.active_markets ?? "—"} sub={`${ov?.total_markets ?? 0} total`} />
        <MetricCard label="24H Volume" value="$84.5M" trend={{ value: "+7.1% vs average", positive: true }} />
        <MetricCard label="Avg Risk Rating" value="AA-" sub="Audited by Trail of Bits" />
      </div>

      {/* TVL + Volume charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Total Value Locked (Billions)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TVL_DATA}>
              <defs>
                <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} unit="B" />
              <Tooltip contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", color: "#fadcd4", borderRadius: 8 }}
                formatter={(v: number) => [`$${v}B`, "TVL"]} />
              <Area type="monotone" dataKey="tvl" stroke="#ff5a1f" strokeWidth={2} fill="url(#tvlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">24H Trading Volume (Millions)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={VOL_DATA} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} unit="M" />
              <Tooltip contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", color: "#fadcd4", borderRadius: 8 }}
                formatter={(v: number) => [`$${v}M`, "Volume"]} />
              <Bar dataKey="vol" fill="#ff5a1f" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Protocol stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Positions */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Position Distribution</p>
          {pos ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={positionDist} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {positionDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", color: "#fadcd4", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Total Positions</span><span>{pos.total_positions}</span></div>
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Principal Locked</span><span className="mono">${(parseFloat(pos.total_principal_locked_wei) / 1e6).toFixed(2)}M</span></div>
              </div>
            </>
          ) : <Skeleton className="h-40" />}
        </Card>

        {/* Liquidations */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Liquidation Metrics</p>
          {liq ? (
            <div className="space-y-3">
              {[
                { label: "Total Auctions", value: liq.total_auctions },
                { label: "Active", value: liq.active_auctions, color: "text-amber-400" },
                { label: "Settled", value: liq.settled_auctions, color: "text-emerald-400" },
                { label: "Recovery Rate", value: `${(liq.average_recovery_rate / 1e6).toFixed(1)}%` },
                { label: "Collateral Liq.", value: `${(parseFloat(liq.total_collateral_liquidated_wei) / 1e18).toFixed(2)} ETH` },
                { label: "Debt Resolved", value: `$${(parseFloat(liq.total_debt_liquidated_wei) / 1e6).toFixed(2)}M` },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{label}</span>
                  <span className={`font-medium mono ${color ?? "text-on-surface"}`}>{value}</span>
                </div>
              ))}
            </div>
          ) : <Skeleton className="h-40" />}
        </Card>

        {/* Revenue */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Revenue Metrics</p>
          {rev ? (
            <div className="space-y-3">
              {[
                { label: "Interest Collected", value: `$${(parseFloat(rev.total_interest_collected_wei) / 1e6).toFixed(4)}M` },
                { label: "Total Repaid", value: `$${(parseFloat(rev.total_repaid_wei) / 1e6).toFixed(2)}M` },
                { label: "Total Repayments", value: rev.total_repayments },
                { label: "Protocol TVL", value: `$${(parseFloat(ov?.total_liquidity_wei ?? "0") / 1e6).toFixed(2)}M` },
                { label: "Active Borrowers", value: ov?.active_borrowers ?? 0 },
                { label: "Active Offers", value: ov?.active_offers ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{label}</span>
                  <span className="font-medium mono text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          ) : <Skeleton className="h-40" />}
        </Card>
      </div>
    </div>
  );
}
