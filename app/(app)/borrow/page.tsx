"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useBorrower, useBorrowerRisk, useBorrow, useRepay, useRegisterBorrower } from "@/hooks/useBorrower";
import { usePositions } from "@/hooks/usePositions";
import { useMarkets } from "@/hooks/useMarkets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatAddress, formatAPR, formatTimestamp } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BorrowPage() {
  const { address } = useAccount();
  const { data: borrower, isLoading: borrowerLoading } = useBorrower(address ?? "");
  const { data: risk } = useBorrowerRisk(address ?? "");
  const { data: markets } = useMarkets({ is_active: true });
  const { data: positions } = usePositions();
  const registerMutation = useRegisterBorrower();
  const borrowMutation = useBorrow();
  const repayMutation = useRepay();

  const [selectedMarket, setSelectedMarket] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [maxAPR, setMaxAPR] = useState("1000");
  const [tokenId, setTokenId] = useState("1");
  const [repayAmount, setRepayAmount] = useState("");

  const healthFactor = risk?.health_factor ?? 0;
  const hfColor = healthFactor > 2 ? "text-emerald-400" : healthFactor > 1.3 ? "text-amber-400" : "text-red-400";

  async function handleBorrow() {
    if (!selectedMarket || !borrowAmount) {
      toast.error("Please fill all fields");
      return;
    }
    await borrowMutation.mutateAsync({
      market_address: selectedMarket,
      amount: borrowAmount,
      token_id: parseInt(tokenId),
      max_apr: parseInt(maxAPR),
    });
  }

  async function handleRepay() {
    if (!selectedMarket || !repayAmount) {
      toast.error("Please fill all fields");
      return;
    }
    await repayMutation.mutateAsync({
      market_address: selectedMarket,
      amount: repayAmount,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
            Institutional Borrowing
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">Borrower Portal</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Access fixed-rate credit with enterprise-grade risk parameters
          </p>
        </div>
      </div>

      {/* Not registered */}
      {address && !borrowerLoading && !borrower && (
        <Card className="p-5 border-amber-400/20 bg-amber-400/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">Not registered as borrower</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Register to access borrowing features</p>
            </div>
            <Button size="sm" onClick={() => registerMutation.mutate()} loading={registerMutation.isPending}>
              Register Now
            </Button>
          </div>
        </Card>
      )}

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {borrowerLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Collateral Value</p>
              <p className="text-xl font-bold text-on-surface mt-1">
                ${(parseFloat(borrower?.total_borrowed ?? "0") / 1e6).toFixed(2)}M
              </p>
              <p className="text-xs text-emerald-400 mt-0.5">+12.4% vs last month</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Outstanding Debt</p>
              <p className="text-xl font-bold text-on-surface mt-1">
                ${(parseFloat(borrower?.outstanding_debt ?? "0") / 1e6).toFixed(2)}M
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">Across active loans</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Borrowing Power</p>
              <p className="text-xl font-bold text-on-surface mt-1">$836K</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Available to draw</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Health Factor</p>
              <p className={`text-xl font-bold mt-1 ${hfColor}`}>{healthFactor.toFixed(2)}</p>
              <Progress value={Math.min(100, healthFactor * 40)} indicatorClassName={hfColor.replace("text-", "bg-")} className="mt-1.5" />
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Reputation Score</p>
              <p className="text-xl font-bold text-primary mt-1">{borrower?.reputation_score ?? "—"}</p>
              <RiskBadge label={borrower?.risk_label ?? "N/A"} />
            </Card>
          </>
        )}
      </div>

      {/* Borrow Form + Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Borrow Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Borrow Assets</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1.5">Select Market</label>
                <select
                  className="h-10 w-full rounded border border-outline-variant/50 bg-surface-container-low px-3 text-sm text-on-surface focus:border-primary-container focus:outline-none"
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                >
                  <option value="">Select a market...</option>
                  {markets?.markets.map((m) => (
                    <option key={m.address} value={m.address}>
                      {m.borrow_asset.symbol || formatAddress(m.borrow_asset.address, 4)} / {m.collateral_asset.symbol || formatAddress(m.collateral_asset.address, 4)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount to Borrow"
                type="number"
                placeholder="0.00"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                suffix="USDC"
                hint="Borrow Power: $836K"
              />

              <div className="grid grid-cols-3 gap-2">
                {["25%", "50%", "MAX"].map((p) => (
                  <button key={p} className="rounded border border-outline-variant/30 py-1.5 text-xs text-on-surface-variant hover:border-primary-container/40 hover:text-primary transition-colors">
                    {p}
                  </button>
                ))}
              </div>

              <Input
                label="Max APR (BPS)"
                type="number"
                placeholder="1000"
                value={maxAPR}
                onChange={(e) => setMaxAPR(e.target.value)}
                hint="1000 BPS = 10.00%"
              />

              <div className="rounded-lg bg-surface-container-low p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Annual Interest Rate</span>
                  <span className="text-primary font-medium">{formatAPR(parseInt(maxAPR) || 0)} Fixed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">New Health Factor</span>
                  <span className={hfColor}>{healthFactor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Liquidation Price (ETH)</span>
                  <span className="text-orange-400">$1,423.00</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleBorrow}
                loading={borrowMutation.isPending}
                disabled={!address || !borrower}
              >
                Execute Borrow Transaction
              </Button>
            </div>
          </Card>

          {/* Quick Repay */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Quick Repay</p>
              <RefreshCw className="h-4 w-4 text-on-surface-variant" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                <div className="h-8 w-8 rounded bg-primary-container/10 flex items-center justify-center text-xs font-bold text-primary">$</div>
                <div className="flex-1">
                  <p className="text-xs text-on-surface-variant">Current Debt</p>
                  <p className="text-sm font-bold text-on-surface mono">${(parseFloat(borrower?.outstanding_debt ?? "0") / 1e6).toFixed(2)}M</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setRepayAmount(borrower?.outstanding_debt ?? "0")}>
                  Repay Full
                </Button>
              </div>
              <Input
                label="Custom Repay Amount"
                type="number"
                placeholder="0.00"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                suffix="USDC"
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleRepay}
                loading={repayMutation.isPending}
                disabled={!address || !repayAmount}
              >
                Repay Custom Amount
              </Button>
            </div>
          </Card>
        </div>

        {/* Active Positions */}
        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Active Borrowing Positions</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Institutional credit lines across multiple markets</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Export CSV</Button>
                <Button variant="secondary" size="sm">Filters</Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Debt Amount</TableHead>
                  <TableHead>Collateral</TableHead>
                  <TableHead className="text-right">Fixed APR</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions?.positions.length ? (
                  positions.positions.map((pos) => (
                    <TableRow key={pos.token_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary-container/15 flex items-center justify-center text-xs font-bold text-primary">U</div>
                          <div>
                            <p className="text-sm font-medium">USDC</p>
                            <p className="text-xs text-on-surface-variant">Token #{pos.token_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right mono">${(parseFloat(pos.principal) / 1e6).toFixed(2)}M</TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{formatAddress(pos.market_address, 4)}</TableCell>
                      <TableCell className="text-right"><span className="text-primary font-bold">{formatAPR(pos.apr)}</span></TableCell>
                      <TableCell><StatusBadge status={pos.status} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState title="No active positions" description="Execute a borrow transaction to get started" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
