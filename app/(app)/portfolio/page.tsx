"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { usePositions, usePortfolio, useClaimPosition, useWithdrawals, useCreateWithdrawal, useCancelWithdrawal, useClaimWithdrawal } from "@/hooks/usePositions";
import { useOffers, useCancelOffer } from "@/hooks/useOffers";
import { useCompletePortfolio } from "@/hooks/usePortfolioData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR, formatTimestamp, formatRelativeTime } from "@/lib/utils";
import { Download, Settings, CheckCircle2, TrendingUp, TrendingDown, DollarSign, Users, BarChart3, Activity, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

// ── Token dot — colored initial circle ───────────────────────────────────────
const TOKEN_COLORS: Record<string, string> = {
  USDC: "#2775CA", USDT: "#26A17B", WETH: "#627EEA", ETH: "#627EEA",
  WBTC: "#F7931A", BTC: "#F7931A", DAI: "#F5AC37", ARB: "#28A0F0",
  LINK: "#375BD2", AAVE: "#B6509E",
};

function TokenDot({ symbol, size = 26 }: { symbol?: string; size?: number }) {
  const sym = symbol ?? "?";
  const color = TOKEN_COLORS[sym] ?? "#FF6A00";
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 border"
      style={{
        width: size, height: size,
        backgroundColor: color + "20",
        borderColor: color + "40",
        color,
        fontSize: Math.floor(size * 0.35),
      }}
    >
      {sym.slice(0, 2)}
    </div>
  );
}

// ── Inline copy button ────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="h-4 w-4 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
      title="Copy address"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// ── Compact USD formatter ─────────────────────────────────────────────────────
function fmtUSD(raw: string, decimals = 6): string {
  if (!raw || raw === "0") return "—";
  const n = parseFloat(raw) / Math.pow(10, decimals);
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export default function PortfolioPage() {
  const { address } = useAccount();
  const { isAuthenticated } = useAuthStore();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const { data: offers, isLoading: offersLoading } = useOffers();
  const { data: withdrawals, isLoading: withdrawalsLoading } = useWithdrawals();
  const claimPosition = useClaimPosition();
  const cancelOffer = useCancelOffer();
  const cancelWithdrawal = useCancelWithdrawal();
  const claimWithdrawal = useClaimWithdrawal();
  const createWithdrawal = useCreateWithdrawal();

  // NEW: Complete portfolio data
  const completePortfolio = useCompletePortfolio(address);
  const borrowerData = completePortfolio.borrower;
  const lenderData = completePortfolio.lender;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Portfolio Overview</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Real-time performance metrics for your institutional assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />Export Data</Button>
          <Button variant="secondary" size="sm" className="gap-1.5"><Settings className="h-3.5 w-3.5" />Manage Notifications</Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {completePortfolio.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            {/* As Borrower */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">As Borrower</p>
              </div>
              <p className="text-2xl font-bold text-on-surface">
                {borrowerData.marketsCount}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {borrowerData.marketsCount === 1 ? 'market' : 'markets'}
              </p>
            </Card>

            {/* As Lender */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">As Lender</p>
              </div>
              <p className="text-2xl font-bold text-on-surface">
                {lenderData.positionsCount}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                active positions
              </p>
            </Card>

            {/* Total Value */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Value</p>
              </div>
              <p className="text-2xl font-bold text-on-surface mono">
                ${(lenderData.totalPositionsValue / 1e6).toFixed(2)}M
              </p>
              <p className="text-xs text-emerald-400 mt-1">Lending + Offers</p>
            </Card>

            {/* Claimable */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Claimable</p>
              </div>
              <p className="text-2xl font-bold text-primary mono">
                ${(lenderData.totalClaimable / 1e6).toFixed(4)}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Ready to claim</p>
            </Card>

            {/* Interest Earned */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Earned</p>
              </div>
              <p className="text-2xl font-bold text-emerald-400 mono">
                ${(lenderData.totalEarned / 1e6).toFixed(4)}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Total interest</p>
            </Card>

            {/* Active Markets */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-on-surface-variant" />
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Markets</p>
              </div>
              <p className="text-2xl font-bold text-on-surface">
                {completePortfolio.totalMarketsCount}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Total active</p>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Card className="p-0 overflow-hidden">
        <Tabs defaultValue="overview">
          <div className="px-5 pt-3 border-b border-outline-variant/20">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="borrower">As Borrower ({borrowerData.marketsCount})</TabsTrigger>
              <TabsTrigger value="positions">Positions ({positions?.count ?? 0})</TabsTrigger>
              <TabsTrigger value="offers">Offers ({offers?.count ?? 0})</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals ({withdrawals?.withdrawals.length ?? 0})</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Role Summary */}
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Your Roles</h3>

                {completePortfolio.isBorrower && (
                  <div className="mb-4 p-4 rounded bg-red-400/5 border border-red-400/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <p className="font-semibold text-on-surface">Borrower in {borrowerData.marketsCount} {borrowerData.marketsCount === 1 ? 'market' : 'markets'}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-on-surface-variant">Track your debt, collateral, and health across markets</p>
                    </div>
                  </div>
                )}

                {completePortfolio.isLender && (
                  <div className="p-4 rounded bg-emerald-400/5 border border-emerald-400/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <p className="font-semibold text-on-surface">Lender in {lenderData.marketsCount} {lenderData.marketsCount === 1 ? 'market' : 'markets'}</p>
                    </div>
                    <div className="space-y-1 text-sm text-on-surface-variant">
                      <p>• Total Lent: ${(lenderData.totalPositionsValue / 1e6).toFixed(2)}M</p>
                      <p>• Total Earned: ${(lenderData.totalEarned / 1e6).toFixed(4)}</p>
                      <p>• Claimable Now: ${(lenderData.totalClaimable / 1e6).toFixed(4)}</p>
                    </div>
                  </div>
                )}

                {!completePortfolio.isBorrower && !completePortfolio.isLender && (
                  <div className="text-center py-8">
                    <p className="text-sm text-on-surface-variant">
                      No activity yet. Start by creating a market or lending to existing markets.
                    </p>
                  </div>
                )}
              </Card>

              {/* Markets Breakdown */}
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-on-surface mb-4">By Market</h3>

                <div className="space-y-3">
                  {Object.entries(lenderData.byMarket).length > 0 ? (
                    Object.entries(lenderData.byMarket).map(([marketAddr, data]) => (
                      <div key={marketAddr} className="p-3 rounded bg-surface-container-low">
                        <p className="text-xs font-mono text-on-surface-variant mb-2">
                          {formatAddress(marketAddr)}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-on-surface-variant">Positions</p>
                            <p className="font-semibold text-on-surface">
                              {data.positions.length} (${(data.totalLent / 1e6).toFixed(2)}M)
                            </p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant">Earned</p>
                            <p className="font-semibold text-emerald-400">
                              ${(data.totalEarned / 1e6).toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center text-on-surface-variant py-4">
                      No lending activity yet
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* As Borrower Tab */}
          <TabsContent value="borrower" className="mt-0 p-4 sm:p-6">
            {borrowerData.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
              </div>
            ) : borrowerData.markets.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    My Markets ({borrowerData.marketsCount})
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Markets where you are the borrower
                  </p>
                </div>

                {borrowerData.markets.map((market: any) => {
                  const dec = market.borrow_asset?.decimals ?? 6;
                  const status = market.is_closed
                    ? "settled"
                    : market.is_liquidating
                    ? "liquidating"
                    : market.is_active
                    ? "active"
                    : "inactive";

                  return (
                    <Card key={market.address} className="p-4 sm:p-5">
                      {/* Header row: pair + status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center shrink-0">
                            <TokenDot symbol={market.borrow_asset?.symbol} size={28} />
                            <div className="-ml-2">
                              <TokenDot symbol={market.collateral_asset?.symbol} size={28} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-on-surface">
                              {market.borrow_asset?.symbol ?? "—"} → {market.collateral_asset?.symbol ?? "—"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="font-mono text-xs text-on-surface-variant truncate">
                                {formatAddress(market.address)}
                              </p>
                              <CopyBtn text={market.address} />
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={status} />
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-4 pb-4 border-b border-outline-variant/10">
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Total Borrowed</p>
                          <p className="text-sm font-semibold text-on-surface mono">
                            {fmtUSD(market.total_principal, dec)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Total Debt</p>
                          <p className="text-sm font-semibold text-amber-400 mono">
                            {fmtUSD(market.total_debt, dec)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Weighted APR</p>
                          <p className="text-sm font-semibold text-primary">
                            {formatAPR(market.weighted_apr)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Utilization</p>
                          <p className="text-sm font-semibold text-on-surface">
                            {(market.utilization_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Available Liquidity</p>
                          <p className="text-sm font-semibold text-emerald-400 mono">
                            {fmtUSD(market.total_liquidity, dec)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Created</p>
                          <p className="text-sm font-semibold text-on-surface-variant">
                            {formatRelativeTime(market.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <a href="/borrow">
                          <Button size="sm">Manage Borrowing →</Button>
                        </a>
                        <a href="/markets">
                          <Button size="sm" variant="secondary">View in Markets</Button>
                        </a>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No markets as borrower"
                description="You haven't created any markets yet. Create a market to start borrowing."
              />
            )}
          </TabsContent>

          {/* Positions */}
          <TabsContent value="positions" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token ID</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Accrued Interest</TableHead>
                  <TableHead className="text-right">Claimable</TableHead>
                  <TableHead className="text-right">APR</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}</TableRow>
                  ))
                ) : positions?.positions.length ? (
                  positions.positions.map((pos) => (
                    <TableRow key={pos.token_id}>
                      <TableCell className="font-medium">#{pos.token_id}</TableCell>
                      <TableCell><span className="mono text-xs">{formatAddress(pos.market_address)}</span></TableCell>
                      <TableCell className="text-right mono">${(parseFloat(pos.principal) / 1e6).toFixed(2)}M</TableCell>
                      <TableCell className="text-right mono text-emerald-400">${(parseFloat(pos.accrued_interest) / 1e6).toFixed(4)}</TableCell>
                      <TableCell className="text-right mono">${(parseFloat(pos.claimable_amount) / 1e6).toFixed(4)}</TableCell>
                      <TableCell className="text-right"><span className="text-primary font-medium">{formatAPR(pos.apr)}</span></TableCell>
                      <TableCell><span className="text-xs">{pos.seniority === 0 ? "Senior" : "Junior"}</span></TableCell>
                      <TableCell><StatusBadge status={pos.status} /></TableCell>
                      <TableCell>
                        {parseFloat(pos.claimable_amount) > 0 && (
                          <Button size="sm" variant="secondary" className="text-xs"
                            onClick={() => claimPosition.mutate({ tokenId: pos.token_id, marketAddress: pos.market_address })}
                            loading={claimPosition.isPending}>
                            Claim
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={9}><EmptyState title="No positions yet" description="Supply liquidity through the Lend portal to get started" /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Offers */}
          <TabsContent value="offers" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer ID</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Filled</TableHead>
                  <TableHead className="text-right">APR</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {offersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}</TableRow>
                  ))
                ) : offers?.offers.length ? (
                  offers.offers.map((o) => (
                    <TableRow key={o.offer_id}>
                      <TableCell>#{o.offer_id}</TableCell>
                      <TableCell><span className="mono text-xs">{formatAddress(o.market_address)}</span></TableCell>
                      <TableCell className="text-right mono">${(parseFloat(o.amount) / 1e6).toFixed(2)}M</TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs">{o.fill_percentage.toFixed(0)}%</span>
                      </TableCell>
                      <TableCell className="text-right"><span className="text-primary">{formatAPR(o.apr)}</span></TableCell>
                      <TableCell><span className="text-xs">{o.seniority === 0 ? "Senior" : "Junior"}</span></TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-xs text-on-surface-variant">{formatTimestamp(o.expiry)}</TableCell>
                      <TableCell>
                        {o.status === "active" && (
                          <Button size="sm" variant="ghost" className="text-xs text-red-400"
                            onClick={() => cancelOffer.mutate({ offerId: o.offer_id, marketAddress: o.market_address })} loading={cancelOffer.isPending}>
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={9}><EmptyState title="No offers" description="Create offers through the Lend portal" /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Withdrawals */}
          <TabsContent value="withdrawals" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Requested</TableHead>
                  <TableHead className="text-right">Fulfilled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Epoch</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}</TableRow>
                  ))
                ) : withdrawals?.withdrawals.length ? (
                  withdrawals.withdrawals.map((w) => (
                    <TableRow key={w.request_id}>
                      <TableCell>#{w.request_id}</TableCell>
                      <TableCell>Position #{w.position_id}</TableCell>
                      <TableCell className="text-right mono">${(parseFloat(w.amount) / 1e6).toFixed(4)}M</TableCell>
                      <TableCell className="text-right mono">
                        {w.fulfilled_amount ? (
                          <span className="text-emerald-400">${(parseFloat(w.fulfilled_amount) / 1e6).toFixed(4)}M</span>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={w.status} />
                        {w.status === "fulfilled" && !w.claimed && (
                          <CheckCircle2 className="inline-block h-3 w-3 text-emerald-400 ml-1" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant">
                        {w.epoch_number !== undefined ? `Epoch #${w.epoch_number}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant">{formatTimestamp(w.requested_at)}</TableCell>
                      <TableCell>
                        {w.status === "pending" && (
                          <Button size="sm" variant="ghost" className="text-xs text-red-400"
                            onClick={() => cancelWithdrawal.mutate({ marketAddress: w.market_address ?? "", requestId: w.request_id })} loading={cancelWithdrawal.isPending}>
                            Cancel
                          </Button>
                        )}
                        {w.status === "fulfilled" && !w.claimed && w.fulfilled_amount && parseFloat(w.fulfilled_amount) > 0 && (
                          <Button size="sm" variant="primary" className="text-xs"
                            onClick={() => claimWithdrawal.mutate({ marketAddress: w.market_address ?? "", requestId: w.request_id })} loading={claimWithdrawal.isPending}>
                            Claim Withdrawal
                          </Button>
                        )}
                        {w.claimed && (
                          <span className="text-xs text-on-surface-variant">Claimed ✓</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={8}><EmptyState title="No withdrawal requests" description="Request withdrawals from your positions" /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
