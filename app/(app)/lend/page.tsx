"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { WalletGate } from "@/components/wallet-gate";
import { useOffers, useCreateOffer, useCancelOffer, useCleanupExpiredOffers } from "@/hooks/useOffers";
import { usePortfolio } from "@/hooks/usePositions";
import { useMyLenderPortfolio } from "@/hooks/usePortfolioData";
import { useMarkets } from "@/hooks/useMarkets";
import { useMaxBorrowable } from "@/hooks/useMarketMetrics";
import { useOfferBookMarketMap } from "@/hooks/useOfferBookMarketMap";
import { formatUnits } from "viem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR, formatTokenAmount, formatAssetAmounts } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { Info, Zap } from "lucide-react";
import { toast } from "sonner";
import { MarketSelector } from "@/components/MarketSelector";

export default function LendPage() {
  const { address } = useAccount();
  const { isAuthenticated } = useAuthStore();
  const { login, isSigningIn } = useSIWE();
  const { data: portfolio } = usePortfolio();
  const lenderPortfolio = useMyLenderPortfolio(address);
  const { data: myOffers, isLoading: offersLoading } = useOffers({ lender: address });
  const { data: markets } = useMarkets({ is_active: true });
  const createOffer = useCreateOffer();
  const cancelOffer = useCancelOffer();
  const cleanupExpiredOffers = useCleanupExpiredOffers();

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
  const { map: offerBookMarketMap } = useOfferBookMarketMap();

  const { data: maxBorrowableWei } = useMaxBorrowable(selectedMarket?.address as `0x${string}` | undefined);
  const remainingDemandWei = selectedMarket && maxBorrowableWei !== undefined
    ? (maxBorrowableWei > BigInt(selectedMarket.total_liquidity)
        ? maxBorrowableWei - BigInt(selectedMarket.total_liquidity)
        : BigInt(0))
    : BigInt(0);

  async function handleCreate() {
    if (!form.market_address || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!selectedMarket) {
      toast.error("Selected market not found");
      return;
    }
    if (!(parseFloat(form.amount) > 0)) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!(parseInt(form.apr) > 0)) {
      toast.error("APR must be greater than 0");
      return;
    }
    await createOffer.mutateAsync({
      market_address: form.market_address,
      amount: form.amount,
      apr: parseInt(form.apr),
      seniority: parseInt(form.seniority) as 0 | 1,
      expiry_days: parseInt(form.expiry_days),
      borrow_asset_address: selectedMarket.borrow_asset.address,
      borrow_asset_decimals: selectedMarket.borrow_asset.decimals,
    });
    setForm({ market_address: "", amount: "", apr: "1250", seniority: "0", expiry_days: "90" });
  }

  const avgAPR = portfolio?.avg_apr ?? 0;

  return (
    <WalletGate title="Connect your wallet" description="Connect your wallet to create lending offers and start earning interest on your assets.">
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
        <Card className="p-4 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Total Deposited</p>
          <p className="text-xl font-bold text-on-surface mt-1 mono truncate">{formatAssetAmounts(lenderPortfolio.totalPositionsValue)}</p>
        </Card>
        <Card className="p-4 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Average APR</p>
          <p className="text-2xl font-bold text-primary mt-1 mono truncate">{(avgAPR / 100).toFixed(2)}%</p>
        </Card>
        <Card className="p-4 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Open Offers</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{myOffers?.count ?? 0}</p>
        </Card>
        <Card className="p-4 border-primary-container/20 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Earned Interest</p>
          <p className="text-xl font-bold text-primary mt-1 mono truncate">
            {formatAssetAmounts(lenderPortfolio.totalEarned, 4)}
          </p>
        </Card>
      </div>
      <p className="text-xs text-on-surface-variant -mt-2">
        Note: these totals blend offers across markets that may borrow different tokens (e.g. USDC vs
        WETH) without a shared price feed - treat them as directional only, not a precise dollar figure.
      </p>


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
                <div className="mt-2 p-2 bg-surface-container-low rounded text-xs space-y-1">
                  <div>
                    <span className="text-on-surface-variant">Borrower:</span>{" "}
                    <span className="font-mono text-on-surface">{formatAddress(selectedMarket.borrower)}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Can still borrow up to:</span>{" "}
                    <span className="font-mono text-primary">
                      {maxBorrowableWei !== undefined
                        ? `${formatTokenAmount(maxBorrowableWei.toString(), selectedMarket.borrow_asset.decimals)} ${selectedMarket.borrow_asset.symbol}`
                        : "…"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Already offered (unfilled):</span>{" "}
                    <span className="font-mono text-on-surface">
                      {formatTokenAmount(selectedMarket.total_liquidity, selectedMarket.borrow_asset.decimals)} {selectedMarket.borrow_asset.symbol}
                    </span>
                  </div>
                  {remainingDemandWei > BigInt(0) && (
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-on-surface-variant">
                        Gap to fully cover borrower&apos;s capacity:{" "}
                        <span className="font-mono text-emerald-400">
                          {formatTokenAmount(remainingDemandWei.toString(), selectedMarket.borrow_asset.decimals)} {selectedMarket.borrow_asset.symbol}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="text-primary underline shrink-0"
                        onClick={() => setField("amount", formatUnits(remainingDemandWei, selectedMarket.borrow_asset.decimals))}
                      >
                        Fill this
                      </button>
                    </div>
                  )}
                  <p className="text-on-surface-variant pt-0.5">
                    This is an open order book, not a direct loan request - your offer joins the
                    queue and gets matched lowest-APR-first whenever the borrower draws down. The
                    numbers above are a guide to current demand, not a hard cap on what you can offer.
                  </p>
                </div>
              )}
            </div>

            <Input
              label={`Amount (${selectedMarket?.borrow_asset.symbol ?? "USDC"})`}
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || parseFloat(v) >= 0) setField("amount", v);
              }}
              suffix={selectedMarket?.borrow_asset.symbol ?? "USDC"}
              hint="Token approval + on-chain submit required"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="APR (BPS)"
                type="number"
                min="1"
                step="1"
                placeholder="1250"
                value={form.apr}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || parseInt(v) >= 0) setField("apr", v);
                }}
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

            {/* Wallet connected (WalletGate lets you through) but not signed in
                (SIWE) yet - address ?, !isAuthenticated. Without this, the
                Submit button below is just silently disabled with nothing on
                the page explaining why - the wallet auto-reconnecting from a
                previous session bypasses the connect button entirely, so
                there's no other place this gets surfaced. */}
            {address && !isAuthenticated && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-400/10 border border-amber-400/30 p-3">
                <p className="text-xs text-amber-400">
                  Sign in with your wallet to submit offers.
                </p>
                <Button size="sm" variant="secondary" onClick={() => login()} loading={isSigningIn}>
                  Sign In
                </Button>
              </div>
            )}

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
              <p className="text-xs text-on-surface-variant mt-1">
                Nothing on-chain runs automatically without a transaction - an offer past its expiry
                doesn&apos;t auto-refund itself. You can always reclaim your own funds immediately by
                clicking Cancel, expired or not; it just won&apos;t show as &quot;Expired&quot; until
                someone (you, or anyone) submits a cleanup transaction.
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
                  myOffers.offers.map((o) => {
                    // o.market_address is the OfferBook clone's address, not the market's.
                    const market = offerBookMarketMap[o.market_address.toLowerCase()];
                    // status only flips to "expired" once someone runs cleanupExpiredOffers() -
                    // until then it's still cancellable even past its expiry timestamp.
                    const isUncleanedExpired =
                      (o.status === "active" || o.status === "partially_filled") &&
                      o.expiry * 1000 < Date.now();
                    return (
                    <TableRow key={o.offer_id}>
                      <TableCell className="mono text-xs">
                        {market ? `${market.borrow_asset.symbol}/${market.collateral_asset.symbol}` : formatAddress(o.market_address, 4)}
                      </TableCell>
                      <TableCell className="text-right mono">
                        {market ? `${formatTokenAmount(o.amount, market.borrow_asset.decimals)} ${market.borrow_asset.symbol}` : "…"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-primary font-bold">{formatAPR(o.apr)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${o.seniority === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                          {o.seniority === 0 ? "Senior" : "Junior"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isUncleanedExpired ? (
                          <span className="text-xs font-medium text-amber-400" title="Expired on-chain but nobody has submitted a cleanup transaction yet - your funds are safe and reclaimable right now via Cancel.">
                            Expired (reclaim below)
                          </span>
                        ) : (
                          <StatusBadge status={o.status} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={isUncleanedExpired ? "text-xs text-amber-400 font-semibold" : "text-xs text-red-400"}
                          onClick={() =>
                            cancelOffer.mutate({ offerId: o.offer_id, offerBookAddress: o.market_address })
                          }
                          loading={cancelOffer.isPending}
                        >
                          {isUncleanedExpired ? "Reclaim Funds" : "Cancel"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })
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
    </WalletGate>
  );
}
