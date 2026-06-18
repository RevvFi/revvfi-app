"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useOffers, useCreateOffer, useCancelOffer } from "@/hooks/useOffers";
import { usePortfolio, useClaimPosition } from "@/hooks/usePositions";
import { useMarkets } from "@/hooks/useMarkets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR, formatTimestamp } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Info, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function LendPage() {
  const { address } = useAccount();
  const { isAuthenticated } = useAuthStore();
  const { data: portfolio } = usePortfolio();
  const { data: myOffers, isLoading: offersLoading } = useOffers();
  const { data: markets } = useMarkets({ is_active: true });
  const createOffer = useCreateOffer();
  const cancelOffer = useCancelOffer();
  const claimPosition = useClaimPosition();

  const [form, setForm] = useState({
    market_address: "",
    amount: "",
    apr: "1250",
    seniority: "0" as "0" | "1",
    expiry_days: "90",
  });

  function setField(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleCreate() {
    if (!form.market_address || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    await createOffer.mutateAsync({
      market_address: form.market_address,
      amount: form.amount,
      apr: parseInt(form.apr),
      seniority: parseInt(form.seniority) as 0 | 1,
      expiry_days: parseInt(form.expiry_days),
    });
    setForm({ market_address: "", amount: "", apr: "1250", seniority: "0", expiry_days: "90" });
  }

  const totalDeposited = portfolio?.total_supplied ?? "0";
  const avgAPR = portfolio?.avg_apr ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Lender Portal</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Optimize your yield by providing liquidity to institutionally vetted credit markets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">History</Button>
          <Button variant="secondary" size="sm">Export CSV</Button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Total Deposited</p>
          <p className="text-2xl font-bold text-on-surface mt-1 mono">${(parseFloat(totalDeposited) / 1e6).toFixed(2)}M</p>
          <p className="text-xs text-emerald-400 mt-0.5">+12.5% this month</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Average APR</p>
          <p className="text-2xl font-bold text-primary mt-1 mono">{(avgAPR / 100).toFixed(2)}%</p>
          <p className="text-xs text-on-surface-variant mt-0.5">0.8% above market</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Open Offers</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{myOffers?.count ?? 0}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Active assets</p>
        </Card>
        <Card className="p-4 border-primary-container/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Claimable Funds</p>
          <p className="text-2xl font-bold text-primary mt-1 mono">${(parseFloat(portfolio?.earned_interest ?? "0") / 1e6).toFixed(2)}</p>
          <Button size="sm" className="mt-2 w-full" onClick={() => claimPosition.mutate(1)}>Claim Now</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* New Offer Form */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">New Lending Offer</p>
            <Info className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1.5">Asset & Market</label>
              <select
                className="h-10 w-full rounded border border-outline-variant/50 bg-surface-container-low px-3 text-sm text-on-surface focus:border-primary-container focus:outline-none"
                value={form.market_address}
                onChange={(e) => setField("market_address", e.target.value)}
              >
                <option value="">Select market...</option>
                {markets?.markets.map((m) => (
                  <option key={m.address} value={m.address}>
                    {m.borrow_asset.symbol || "USDC"} — {formatAddress(m.address)}
                  </option>
                ))}
              </select>
            </div>

            <Input label="Amount (USDC)" type="number" placeholder="0.00" value={form.amount}
              onChange={(e) => setField("amount", e.target.value)} suffix="USDC"
              hint={`Available: ${(parseFloat(totalDeposited) / 1e6).toFixed(2)}M USDC`} />

            <div className="grid grid-cols-2 gap-3">
              <Input label="APR (BPS)" type="number" placeholder="1250" value={form.apr}
                onChange={(e) => setField("apr", e.target.value)} hint={`= ${(parseInt(form.apr) / 100).toFixed(2)}%`} />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1.5">Seniority</label>
                <select
                  className="h-10 w-full rounded border border-outline-variant/50 bg-surface-container-low px-3 text-sm text-on-surface focus:border-primary-container focus:outline-none"
                  value={form.seniority}
                  onChange={(e) => setField("seniority", e.target.value as "0" | "1")}
                >
                  <option value="0">Senior Tranche</option>
                  <option value="1">Junior Tranche</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1.5">Duration (Days)</label>
              <input type="range" min={7} max={365} value={parseInt(form.expiry_days)}
                onChange={(e) => setField("expiry_days", e.target.value)}
                className="w-full accent-primary-container" />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>7d</span><span className="font-medium text-on-surface">{form.expiry_days}d</span><span>365d</span>
              </div>
            </div>

            <div className="rounded-lg bg-surface-container-low p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Estimated Return</span>
                <span className="text-emerald-400 font-medium">+${((parseFloat(form.amount || "0") * (parseInt(form.apr) / 10000) * (parseInt(form.expiry_days) / 365)) / 1e6).toFixed(4)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Protocol Fee (0.1%)</span>
                <span className="text-on-surface-variant">-${((parseFloat(form.amount || "0") * 0.001) / 1e6).toFixed(6)}M</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-3">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-on-surface">Auto-Compound Enabled</p>
                <p className="text-xs text-on-surface-variant">Rewards reinvested into senior tranches</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleCreate} loading={createOffer.isPending} disabled={!isAuthenticated}>
              SUBMIT MARKET OFFER
            </Button>
          </div>
        </Card>

        {/* Active Placements */}
        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Active Market Placements</p>
                <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                  LIVE
                </span>
              </div>
              <div className="flex gap-1">
                {["Active", "Pending", "Closed"].map((t) => (
                  <button key={t} className={`px-3 py-1 text-xs rounded-full transition-colors ${t === "Active" ? "bg-primary-container/20 text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{t}</button>
                ))}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Yield / APR</TableHead>
                  <TableHead>Risk Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {offersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : myOffers?.offers.length ? (
                  myOffers.offers.map((o) => (
                    <TableRow key={o.offer_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary-container/10 flex items-center justify-center text-xs font-bold text-primary">U</div>
                          <div>
                            <p className="text-sm font-medium">USDC</p>
                            <p className="text-xs text-on-surface-variant">Offer #{o.offer_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right mono">${(parseFloat(o.amount) / 1e6).toFixed(2)}M</TableCell>
                      <TableCell className="text-right">
                        <p className="text-primary font-bold">{formatAPR(o.apr)}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${o.seniority === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                          {o.seniority === 0 ? "● Senior" : "● Mezzanine"}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs text-red-400"
                          onClick={() => cancelOffer.mutate(o.offer_id)} loading={cancelOffer.isPending}>
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState title="No active offers" description="Create your first lending offer to start earning yield" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {myOffers && (
              <div className="px-4 py-2 border-t border-outline-variant/10 text-xs text-on-surface-variant">
                Showing {Math.min(3, myOffers.count)} of {myOffers.count} active offers
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
