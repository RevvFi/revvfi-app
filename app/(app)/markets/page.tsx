"use client";

import { useState } from "react";
import Link from "next/link";
import { useMarkets } from "@/hooks/useMarkets";
import { Card } from "@/components/ui/card";
import { StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { formatAddress, formatAPR, formatTimestamp } from "@/lib/utils";
import { Search, Filter, RefreshCw, Plus, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

const RISK_RATINGS = ["AAA", "AA", "A", "B"];

export default function MarketsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [ratingFilter, setRatingFilter] = useState<string>("");

  const { data, isLoading, refetch, isFetching } = useMarkets({
    is_active: activeFilter,
    limit: 50,
  });

  const markets = (data?.markets ?? []).filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.address.toLowerCase().includes(q) ||
      m.borrower.toLowerCase().includes(q) ||
      m.borrow_asset.address.toLowerCase().includes(q) ||
      m.collateral_asset.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
            Market Orchestrator
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">Market Explorer</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Institutional liquidity discovery across lending protocols. Real-time risk assessment.
          </p>
        </div>
        <Link href="/markets/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Market
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Markets", value: data?.count ?? "—" },
          { label: "Active Markets", value: data?.markets.filter((m) => m.is_active).length ?? "—" },
          { label: "Liquidating", value: data?.markets.filter((m) => m.is_liquidating).length ?? 0 },
          { label: "Avg Risk Rating", value: "AA-" },
        ].map(({ label, value }) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
            <input
              className="h-9 w-full rounded border border-outline-variant/50 bg-surface-container-low pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:outline-none"
              placeholder="Search by address, borrower..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            {(["All", "Active", "Inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f === "All" ? undefined : f === "Active")}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  (f === "All" && activeFilter === undefined) ||
                  (f === "Active" && activeFilter === true) ||
                  (f === "Inactive" && activeFilter === false)
                    ? "border-primary-container/40 bg-primary-container/15 text-primary"
                    : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-auto">
            <p className="text-xs text-on-surface-variant self-center mr-1">Risk:</p>
            {RISK_RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(ratingFilter === r ? "" : r)}
                className={`px-2.5 py-1 text-xs rounded font-bold transition-colors ${
                  ratingFilter === r
                    ? "bg-primary-container/20 text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={() => refetch()} className={isFetching ? "animate-spin" : ""}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">TVL</TableHead>
              <TableHead className="text-right">Liquidity</TableHead>
              <TableHead className="text-right">Avg APR</TableHead>
              <TableHead className="text-right">Utilization</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : markets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState title="No markets found" description="Try adjusting your filters" />
                </TableCell>
              </TableRow>
            ) : (
              markets.map((m) => (
                <TableRow
                  key={m.address}
                  onClick={() => router.push(`/markets/${m.address}`)}
                  className="cursor-pointer hover:bg-white/[0.02]"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {m.borrow_asset.symbol?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">
                          {m.borrow_asset.symbol || "USDC"} / {m.collateral_asset.symbol || "ETH"}
                        </p>
                        <p className="text-xs text-on-surface-variant mono">{formatAddress(m.address)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm mono text-on-surface-variant">{formatAddress(m.borrower)}</p>
                  </TableCell>
                  <TableCell>
                    <RiskBadge label="AAA" />
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="text-sm mono">{m.total_principal === "0" ? "—" : `$${(parseFloat(m.total_principal) / 1e6).toFixed(2)}M`}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="text-sm mono">{m.total_liquidity === "0" ? "—" : `$${(parseFloat(m.total_liquidity) / 1e6).toFixed(2)}M`}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="text-sm mono text-primary">{formatAPR(m.weighted_apr)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="text-sm mono">{(m.utilization_rate * 100).toFixed(1)}%</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.is_liquidating ? "liquidating" : m.is_active ? "active" : "inactive"} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {data && (
          <div className="px-4 py-3 border-t border-outline-variant/10 text-xs text-on-surface-variant">
            Showing {markets.length} of {data.count} markets
          </div>
        )}
      </Card>

      {/* Institutional Risk Framework */}
      <Card className="p-5 flex gap-4 items-start">
        <div className="h-10 w-10 rounded-lg bg-primary-container/10 flex items-center justify-center shrink-0">
          <Filter className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface mb-1">Institutional Risk Framework</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            All markets on RevvFi are subjected to algorithmic stress-testing and verified by 3rd party auditors. Ratings from AAA to D represent a composite score of borrower reputation, collateral volatility, and smart contract complexity. Users should perform their own due diligence before committing capital.
          </p>
        </div>
      </Card>
    </div>
  );
}
