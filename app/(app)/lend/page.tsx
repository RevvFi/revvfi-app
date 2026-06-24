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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Info, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MarketSelector } from "@/components/MarketSelector";

export default function LendPage() {
  const { address } = useAccount();
  const { isAuthenticated } = useAuthStore();
  const { data: portfolio } = usePortfolio();
  const { data: myOffers, isLoading: offersLoading } = useOffers({ lender: address });
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

  const selectedMarket = markets?.markets.find((m) => m.address === form.market_address);

  async function handleCreate() {
    if (!form.market_address || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!selectedMarket) {
      toast.error("Selected market not found");
      return;
    }
    await createOffer.mutateAsync({
      market_address: form.market_address,
      amount: form.amount,
      apr: parseInt(form.apr),
      seniority: parseInt(form.seniority) as 0 | 1,
      expiry_days: parseInt(form.expiry_days),
      // required for on-chain approve step
      borrow_asset_address: selectedMarket.borrow_asset.address,
      borrow_asset_decimals: selectedMarket.borrow_asset.decimals,
    });
    setForm({ market_address: "", amount: "", apr: "1250", seniority: "0", expiry_days: "90" });
  }

  const totalDeposited = portfolio?.total_supplied ?? "0";
  const avgAPR = portfolio?.avg_apr ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Lender Portal</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Optimize your yield by providing liquidity to institutionally vetted credit markets
          </p>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Total Deposited</p>
          <p className="text-2xl font-bold text-on-surface mt-1 mono">${(parseFloat(totalDeposited) / 1e6).toFixed(2)}M</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Average APR</p>
          <p className="text-2xl font-bold text-primary mt-1 mono">{(avgAPR / 100).toFixed(2)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Open Offers</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{myOffers?.count ?? 0}</p>
        </Card>
        <Card className="p-4 border-primary-container/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Earned Interest</p>
          <p className="text-2xl font-bold text-primary mt-1 mono">
            ${(parseFloat(portfolio?.earned_interest ?? "0") / 1e6).toFixed(4)}M
          </p>
        </Card>
      </div>

      {/* Info banner for lenders */}
      <Card className="p-4 border-blue-400/20 bg-blue-400/5">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-blue-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-on-surface">Open Market Lending</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Any lender can create offers for any market. Choose your target market, set your APR, and provide liquidity.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* New Offer Form */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">New Lending Offer</p>
            <Info className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                Select Market to Lend To
              </label>
              <MarketSelector
                value={form.market_address}
                onValueChange={(value) => setField("market_address", value)}
                showBadge={false}
                filterByLender={false}
              />
              {selectedMarket && (
                <div className="mt-2 p-2 bg-surface-container-low rounded text-xs">
                  <span className="text-on-surface-variant">Borrower:</span>{" "}
                  <span className="font-mono text-on-surface">{formatAddress(selectedMarket.borrower)}</span>
                </div>
              )}
            </div>

            <Input
              label={`Amount (${selectedMarket?.borrow_asset.symbol ?? "USDC"})`}
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              suffix={selectedMarket?.borrow_asset.symbol ?? "USDC"}
              hint="Token approval + on-chain submit required"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="APR (BPS)"
                type="number"
                placeholder="1250"
                value={form.apr}
                onChange={(e) => setField("apr", e.target.value)}
                hint={`= ${(parseInt(form.apr || "0") / 100).toFixed(2)}%`}
              />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                  Seniority
                </label>
                <select
                  className="h-10 w-full rounded border border-outline-variant/50 bg-surface-container-low px-3 text-sm text-on-surface focus:border-primary-container focus:outline-none"
                  value={form.seniority}
                  onChange={(e) => setField("seniority", e.target.value as "0" | "1")}
                >
                  <option value="0">Senior</option>
                  <option value="1">Junior</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                Duration: <span className="text-on-surface">{form.expiry_days}d</span>
              </label>
              <input
                type="range"
                min={7}
                max={365}
                value={parseInt(form.expiry_days)}
                onChange={(e) => setField("expiry_days", e.target.value)}
                className="w-full accent-primary-container"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>7d</span><span>365d</span>
              </div>
            </div>

            <div className="rounded-lg bg-surface-container-low p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Fixed APR</span>
                <span className="text-on-surface font-semibold">
                  {(parseInt(form.apr || "0") / 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Est. Interest Earned</span>
                <span className="text-emerald-400 font-medium">
                  +{((parseFloat(form.amount || "0") * (parseInt(form.apr || "0") / 10000) * (parseInt(form.expiry_days) / 365))).toFixed(2)} {selectedMarket?.borrow_asset.symbol ?? "USDC"}
                </span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-1.5">
                <span className="text-on-surface-variant font-medium">Total at Maturity</span>
                <span className="text-on-surface font-bold">
                  {(parseFloat(form.amount || "0") + (parseFloat(form.amount || "0") * (parseInt(form.apr || "0") / 10000) * (parseInt(form.expiry_days) / 365))).toFixed(2)} {selectedMarket?.borrow_asset.symbol ?? "USDC"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-3">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-xs text-on-surface">
                Two MetaMask signatures required: approve + submit offer
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCreate}
              loading={createOffer.isPending}
              disabled={!isAuthenticated || !selectedMarket}
            >
              SUBMIT MARKET OFFER
            </Button>
          </div>
        </Card>

        {/* Active Placements */}
        <div className="lg:col-span-3">
          <Card>
            <div className="p-5 pb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Active Market Placements
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">APR</TableHead>
                  <TableHead>Seniority</TableHead>
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
                      <TableCell className="mono text-xs">{formatAddress(o.market_address, 4)}</TableCell>
                      <TableCell className="text-right mono">{(parseFloat(o.amount) / 1e6).toFixed(2)}M</TableCell>
                      <TableCell className="text-right">
                        <span className="text-primary font-bold">{formatAPR(o.apr)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${o.seniority === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                          {o.seniority === 0 ? "Senior" : "Junior"}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400"
                          onClick={() =>
                            cancelOffer.mutate({ offerId: o.offer_id, marketAddress: o.market_address })
                          }
                          loading={cancelOffer.isPending}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No active offers"
                        description="Create your first lending offer to start earning yield"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Claimable positions */}
          {portfolio && parseFloat(portfolio.earned_interest) > 0 && (
            <Card className="mt-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Claimable Positions
              </p>
              <p className="text-sm text-on-surface-variant">
                Use the Portfolio page to claim individual positions (requires market address + position token ID).
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
