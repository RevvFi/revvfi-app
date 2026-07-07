"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { queryKeys } from "@/constants/query-keys";
import { useMarkets } from "@/hooks/useMarkets";
import { useLiquidations } from "@/hooks/useAuctions";
import { Card, MetricCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatTokenAmount } from "@/lib/utils";

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

  // Per-market utilization/liquidity - real data from useMarkets(), safe to
  // chart across markets even when they borrow different tokens (Market A
  // borrows USDC, Market B borrows WETH) because these two metrics are
  // either unitless (%) or kept per-market with its own token label, unlike
  // a naive cross-token dollar sum.
  const marketList = markets?.markets ?? [];
  const utilizationByMarket = marketList.map((m) => ({
    name: `${m.borrow_asset.symbol}/${m.collateral_asset.symbol}`,
    utilization: Math.round((m.utilization_rate ?? 0) * 100),
  }));

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Analytics</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Protocol-wide performance metrics</p>
      </div>

      {/* Key metrics - all real, backend-derived (no fabricated placeholder numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Liquidity"
          value={ov?.total_liquidity_wei ? formatTokenAmount(ov.total_liquidity_wei, 6) : "—"}
          sub="Blended across markets (see note below)"
        />
        <MetricCard label="Active Markets" value={ov?.active_markets ?? "—"} sub={`${ov?.total_markets ?? 0} total`} />
        <MetricCard label="Active Borrowers" value={ov?.active_borrowers ?? "—"} sub={`${ov?.active_offers ?? 0} active offers`} />
        <MetricCard label="Total Positions" value={pos?.total_positions ?? "—"} sub={`${liq?.active_auctions ?? 0} active liquidations`} />
      </div>
      <p className="text-xs text-on-surface-variant -mt-2">
        Note: markets can borrow different tokens (e.g. USDC vs WETH) - dollar totals below sum raw
        on-chain amounts without a shared price feed, so treat "Total Liquidity" as directional only.
      </p>

      {/* Per-market utilization - real per-market data, not a fabricated time series */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Utilization by Market</p>
          {marketList.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={utilizationByMarket} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", color: "#fadcd4", borderRadius: 8 }}
                  formatter={(v: number) => [`${v}%`, "Utilization"]} />
                <Bar dataKey="utilization" fill="#ff5a1f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-on-surface-variant">No markets yet.</p>
          )}
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
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Principal Locked</span><span className="mono">{formatTokenAmount(pos.total_principal_locked_wei, 6)}</span></div>
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
                { label: "Recovery Rate", value: `${liq.average_recovery_rate.toFixed(1)}%` },
                { label: "Collateral Liq.", value: formatTokenAmount(liq.total_collateral_liquidated_wei, 18, 4) },
                { label: "Debt Resolved", value: formatTokenAmount(liq.total_debt_liquidated_wei, 6) },
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
                { label: "Interest Collected", value: formatTokenAmount(rev.total_interest_collected_wei, 6, 4) },
                { label: "Total Repaid", value: formatTokenAmount(rev.total_repaid_wei, 6) },
                { label: "Total Repayments", value: rev.total_repayments },
                { label: "Protocol TVL", value: formatTokenAmount(ov?.total_liquidity_wei ?? "0", 6) },
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
