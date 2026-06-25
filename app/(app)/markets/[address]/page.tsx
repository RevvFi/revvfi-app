"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useMarket, useMarketMetrics } from "@/hooks/useMarkets";
import { useBorrower, useBorrowerRisk } from "@/hooks/useBorrower";
import { useOffers } from "@/hooks/useOffers";
import { usePositions } from "@/hooks/usePositions";
import { MarketParticipants } from "@/components/MarketParticipants";
import { Card } from "@/components/ui/card";
import { StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatAddress, formatAPR, formatTimestamp } from "@/lib/utils";
import { ArrowLeft, Share2, Plus, ExternalLink } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from "recharts";

const MOCK_LIQUIDITY = [
  { time: "00:00", value: 4.2 }, { time: "06:00", value: 3.8 }, { time: "12:00", value: 5.1 },
  { time: "18:00", value: 4.6 }, { time: "23:59", value: 4.8 },
];
const MOCK_APR = [
  { time: "Min", value: 4.2 }, { time: "Avg", value: 6.8 }, { time: "Max", value: 9.1 },
];

export default function MarketDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const { address: userAddress } = useAccount();
  const { data: market, isLoading } = useMarket(address);
  const { data: metrics } = useMarketMetrics(address);
  const { data: borrower } = useBorrower(market?.borrower ?? "");
  const { data: risk } = useBorrowerRisk(market?.borrower ?? "");
  const { data: offers } = useOffers({ market_address: address });
  const { data: positionsData } = usePositions({ market_address: address });

  const userRole = useMemo(() => {
    if (!userAddress || !market) return 'visitor' as const;
    if (market.borrower.toLowerCase() === userAddress.toLowerCase()) return 'borrower' as const;
    if (positionsData?.positions.some(p =>
      p.market_address.toLowerCase() === address.toLowerCase()
    )) return 'lender' as const;
    return 'visitor' as const;
  }, [userAddress, market, positionsData, address]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-on-surface-variant">Market not found</p>
        <Link href="/markets" className="mt-3 text-sm text-primary hover:underline">← Back to Markets</Link>
      </div>
    );
  }

  const utilizationPct = market.utilization_rate * 100;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb & header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/markets" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Markets
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-on-surface">
              {market.borrow_asset.symbol || "USDC"} / {market.collateral_asset.symbol || "ETH"} Market Details
            </h1>
            <StatusBadge status={market.is_active ? "active" : "inactive"} />
            {market.is_liquidating && <StatusBadge status="liquidating" />}
            {userRole === 'borrower' && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                You: Borrower
              </span>
            )}
            {userRole === 'lender' && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                You: Lender
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant mono mt-1">{address}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share Market
          </Button>
          {userRole === 'borrower' ? (
            <Link href="/borrow">
              <Button className="gap-1.5">
                Go to Borrow Portal
              </Button>
            </Link>
          ) : (
            <Link href="/lend">
              <Button className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Supply Liquidity
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Health Factor", value: risk?.health_factor?.toFixed(2) ?? "—", sub: "Liquidation at < 1.10", color: risk?.health_factor && risk.health_factor > 1.5 ? "text-emerald-400" : "text-orange-400" },
          { label: "Total Debt", value: `$${(parseFloat(market.total_debt) / 1e6).toFixed(2)}M`, sub: "USDC" },
          { label: "TVL (Collateral)", value: `$${(parseFloat(market.total_principal) / 1e6).toFixed(2)}M`, sub: `LTV: ${utilizationPct.toFixed(1)}%` },
          { label: "Est. Annual Interest", value: formatAPR(market.weighted_apr), sub: "Floating base rate", color: "text-primary" },
          { label: "Active Positions", value: metrics?.active_positions ?? 0, sub: "Lending positions" },
        ].map(({ label, value, sub, color }) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
            <p className={`text-xl font-bold ${color ?? "text-on-surface"}`}>{value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Borrower profile + Supply pool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Borrower */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Borrower Profile</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-container/15 flex items-center justify-center">
              <span className="text-primary text-lg font-black">G</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{borrower ? formatAddress(borrower.address) : "—"}</p>
              <p className="text-xs text-on-surface-variant">Institutional Borrower</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Reputation Score</span>
              <span className="font-bold text-primary">{borrower?.reputation_score ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Risk Label</span>
              <RiskBadge label={borrower?.risk_label ?? "N/A"} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Active Loans</span>
              <span className="text-on-surface">{borrower?.active_loans ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Default Rate</span>
              <span className={borrower && borrower.default_rate > 10 ? "text-orange-400" : "text-on-surface"}>
                {borrower?.default_rate.toFixed(1) ?? 0}%
              </span>
            </div>
          </div>
        </Card>

        {/* Supply Pool */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Supply Pool Capacity</p>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ExternalLink className="h-3 w-3" /> View Pool Analytics
            </Button>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#43312b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ff5a1f" strokeWidth="3"
                  strokeDasharray={`${utilizationPct} ${100 - utilizationPct}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-on-surface">{utilizationPct.toFixed(0)}%</span>
                <span className="text-[10px] text-on-surface-variant">UTILIZED</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Available Liquidity</span>
                <span className="mono text-on-surface">${(parseFloat(market.total_liquidity) / 1e6).toFixed(2)}M USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Total Supplied</span>
                <span className="mono text-on-surface">${(parseFloat(market.total_principal) / 1e6).toFixed(2)}M USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Avg APR</span>
                <span className="mono text-primary">{formatAPR(market.weighted_apr)}</span>
              </div>
            </div>
          </div>
          <Progress value={utilizationPct} className="h-2" indicatorClassName={utilizationPct > 80 ? "bg-orange-400" : "bg-primary-container"} />
        </Card>
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Liquidity Depth</p>
            <div className="flex gap-1">
              {["1H", "1D", "1W"].map((t) => (
                <button key={t} className={`px-2 py-0.5 text-xs rounded ${t === "1D" ? "bg-primary-container/20 text-primary" : "text-on-surface-variant"}`}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={MOCK_LIQUIDITY}>
              <defs>
                <linearGradient id="liqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill: "#e4beb3", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", color: "#fadcd4", borderRadius: 8 }} />
              <Area type="monotone" dataKey="value" stroke="#ff5a1f" strokeWidth={2} fill="url(#liqGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">APR Yield History</p>
          <div className="space-y-3">
            {[
              { label: "Min APR", value: "4.2%", color: "text-emerald-400" },
              { label: "Avg APR", value: "6.8%", color: "text-amber-400" },
              { label: "Max APR", value: "9.1%", color: "text-orange-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">{label}</span>
                <span className={`text-sm font-bold mono ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant mb-1">
              <span>Collateral Stability</span><span className="text-emerald-400">Optimal</span>
            </div>
            <Progress value={85} indicatorClassName="bg-emerald-400" />
            <div className="flex justify-between text-xs text-on-surface-variant mt-2 mb-1">
              <span>Oracle Latency</span><span className="text-on-surface">120ms</span>
            </div>
            <Progress value={92} indicatorClassName="bg-primary-container" />
          </div>
        </Card>
      </div>

      {/* Tabs: Offers, Positions, Activity */}
      <Card className="p-0 overflow-hidden">
        <Tabs defaultValue="offers" className="w-full">
          <div className="px-5 pt-3">
            <TabsList>
              <TabsTrigger value="offers">Offers ({offers?.count ?? 0})</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="activity">Market Activity</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="offers" className="mt-0 px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lender</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">APR</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers?.offers.length ? (
                  offers.offers.map((o) => (
                    <TableRow key={o.offer_id}>
                      <TableCell><span className="mono text-xs">{formatAddress(o.lender)}</span></TableCell>
                      <TableCell className="text-right mono">${(parseFloat(o.amount) / 1e6).toFixed(2)}M</TableCell>
                      <TableCell className="text-right"><span className="text-primary font-medium">{formatAPR(o.apr)}</span></TableCell>
                      <TableCell><span className="text-xs">{o.seniority === 0 ? "Senior" : "Junior"}</span></TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right text-xs text-on-surface-variant">{formatTimestamp(o.expiry)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                    title="No offers yet"
                    description={userRole === 'borrower'
                      ? "No lenders have submitted offers for your market yet. Share your market to attract lenders."
                      : "Be the first to supply liquidity to this market"}
                    action={userRole === 'borrower'
                      ? <Link href="/borrow"><Button size="sm">View Borrow Portal</Button></Link>
                      : <Link href="/lend"><Button size="sm">Create Offer</Button></Link>}
                  />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="participants" className="mt-0 p-5">
            <MarketParticipants marketAddress={address} />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState title="No recent activity" description="Activity will appear here as transactions occur" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
