"use client";

import { useAccount } from "wagmi";
import { usePositions, usePortfolio, useClaimPosition, useWithdrawals, useCreateWithdrawal, useCancelWithdrawal } from "@/hooks/usePositions";
import { useOffers, useCancelOffer } from "@/hooks/useOffers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR, formatTimestamp, formatRelativeTime } from "@/lib/utils";
import { Download, Settings } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

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
  const createWithdrawal = useCreateWithdrawal();

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Total Value</p>
              <p className="text-2xl font-bold text-on-surface mt-1 mono">${(parseFloat(portfolio?.total_value ?? "0") / 1e6).toFixed(2)}M</p>
              <p className="text-xs text-emerald-400 mt-0.5">+4.2% across 12 networks</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Active Positions</p>
              <p className="text-2xl font-bold text-on-surface mt-1">{portfolio?.active_positions ?? 0}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{portfolio?.settled_positions ?? 0} settled</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Pending</p>
              <p className="text-2xl font-bold text-on-surface mt-1">{withdrawals?.withdrawals.filter(w => w.status === "pending").length ?? 0}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Withdrawal requests</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Claimable</p>
              <p className="text-2xl font-bold text-primary mt-1 mono">${(parseFloat(portfolio?.earned_interest ?? "0") / 1e6).toFixed(2)}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">REVV rewards</p>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Card className="p-0 overflow-hidden">
        <Tabs defaultValue="positions">
          <div className="px-5 pt-3 border-b border-outline-variant/20">
            <TabsList>
              <TabsTrigger value="positions">Positions ({positions?.count ?? 0})</TabsTrigger>
              <TabsTrigger value="offers">Offers ({offers?.count ?? 0})</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals ({withdrawals?.withdrawals.length ?? 0})</TabsTrigger>
            </TabsList>
          </div>

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
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}</TableRow>
                  ))
                ) : withdrawals?.withdrawals.length ? (
                  withdrawals.withdrawals.map((w) => (
                    <TableRow key={w.request_id}>
                      <TableCell>#{w.request_id}</TableCell>
                      <TableCell>Position #{w.position_id}</TableCell>
                      <TableCell className="text-right mono">${(parseFloat(w.amount) / 1e6).toFixed(4)}M</TableCell>
                      <TableCell><StatusBadge status={w.status} /></TableCell>
                      <TableCell className="text-xs text-on-surface-variant">{formatTimestamp(w.requested_at)}</TableCell>
                      <TableCell>
                        {w.status === "pending" && (
                          <Button size="sm" variant="ghost" className="text-xs text-red-400"
                            onClick={() => cancelWithdrawal.mutate({ marketAddress: w.market_address ?? "", requestId: w.request_id })} loading={cancelWithdrawal.isPending}>
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6}><EmptyState title="No withdrawal requests" description="Request withdrawals from your positions" /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
