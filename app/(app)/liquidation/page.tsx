"use client";

import { useState } from "react";
import {
  useLiquidations,
  useAuction,
  useAuctionPrice,
  useCountdown,
  usePlaceBid,
} from "@/hooks/useAuctions";
import { useTriggerLiquidation } from "@/hooks/useLiquidation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatAddress, formatCountdown, fmtUSD, formatAssetAmounts } from "@/lib/utils";
import { formatUnits } from "viem";
import {
  AlertTriangle,
  Zap,
  ShieldCheck,
  TrendingDown,
  Activity,
  Gavel,
} from "lucide-react";
import type { Market } from "@/types";

// ─── Trigger-Liquidation Card ─────────────────────────────────────────────────

function LiquidatableMarketCard({ market }: { market: Market }) {
  const trigger = useTriggerLiquidation();

  const utilizationPct = (market.utilization_rate * 100).toFixed(1);

  return (
    <Card className="p-5 border-red-500/20 bg-red-500/[0.03]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">
              {market.borrow_asset.symbol} / {market.collateral_asset.symbol}
            </p>
            <p className="text-xs text-on-surface-variant mono">
              {formatAddress(market.address)}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
          LIQUIDATABLE
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-xs text-on-surface-variant mb-1">Total Debt</p>
          <p className="text-sm font-bold text-on-surface mono">
            {fmtUSD(market.total_debt, 6)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-xs text-on-surface-variant mb-1">Collateral</p>
          <p className="text-sm font-bold text-on-surface mono">
            {fmtUSD(market.total_principal, 6)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-xs text-on-surface-variant mb-1">Utilization</p>
          <p className="text-sm font-bold text-red-400 mono">{utilizationPct}%</p>
        </div>
      </div>

      <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 mb-4">
        <p className="text-xs text-red-400 font-medium">
          Position health has fallen below the liquidation threshold. Anyone can
          trigger the Dutch auction and claim the liquidation incentive.
        </p>
      </div>

      <Button
        className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white border-0"
        onClick={() => trigger.mutate({ marketAddress: market.address as `0x${string}` })}
        loading={trigger.isPending}
      >
        <Zap className="h-4 w-4" />
        Trigger Liquidation Auction
      </Button>
    </Card>
  );
}

// ─── Active-Auction Bid Card ──────────────────────────────────────────────────

function ActiveAuctionCard({ auctionId, market }: { auctionId: number; market: Market }) {
  const [bidAmount, setBidAmount] = useState("");
  const { data: auction, isLoading } = useAuction(auctionId);
  const { data: priceData } = useAuctionPrice(auctionId);
  const remaining = useCountdown(auction?.end_time ?? 0);
  const placeBid = usePlaceBid();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!auction) return null;

  const currentPrice = priceData?.current_price ?? auction.current_price;
  const currentPriceNum = Number(formatUnits(BigInt(currentPrice || "0"), market.borrow_asset.decimals));
  const collateralNum = Number(formatUnits(BigInt(auction.collateral_amount || "0"), market.collateral_asset.decimals));
  const isUrgent = remaining < 3600 && remaining > 0;

  async function handleBid() {
    if (!bidAmount) return;
    await placeBid.mutateAsync({
      auctionId,
      bidAmount,
      borrowAssetAddress: market.borrow_asset.address,
      borrowAssetDecimals: market.borrow_asset.decimals,
    });
    setBidAmount("");
  }

  return (
    <Card className="p-5 border-amber-500/20">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <Gavel className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">
              AUC-{auctionId} · {market.borrow_asset.symbol} / {market.collateral_asset.symbol}
            </p>
            <p className="text-xs text-on-surface-variant mono">
              {formatAddress(market.address)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Remaining</p>
          <p className={`text-base font-bold mono ${isUrgent ? "text-red-400" : "text-on-surface"}`}>
            {formatCountdown(remaining)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-xs text-on-surface-variant mb-1">Collateral</p>
          <p className="text-sm font-bold text-on-surface">
            {collateralNum.toFixed(4)} {market.collateral_asset.symbol}
          </p>
        </div>
        <div className="rounded-lg bg-blue-500/[0.08] p-3">
          <p className="text-xs text-blue-400 mb-1">Current Price</p>
          <p className="text-sm font-bold text-blue-300 mono">
            {currentPriceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} {market.borrow_asset.symbol}
          </p>
          <div className="flex items-center gap-0.5 mt-0.5">
            <TrendingDown className="h-2.5 w-2.5 text-red-400" />
            <p className="text-[10px] text-red-400">Decaying</p>
          </div>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-xs text-on-surface-variant mb-1">Highest Bid</p>
          <p className="text-sm font-bold text-on-surface mono">
            {parseFloat(auction.highest_bid) > 0
              ? `${Number(formatUnits(BigInt(auction.highest_bid), market.borrow_asset.decimals)).toLocaleString()} ${market.borrow_asset.symbol}`
              : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          label="Bid Amount"
          type="number"
          placeholder="0.00"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          suffix={market.borrow_asset.symbol}
          className="flex-1"
        />
        <div className="flex flex-col justify-end">
          <Button
            size="lg"
            onClick={handleBid}
            loading={placeBid.isPending}
            disabled={!bidAmount}
            className="gap-2 whitespace-nowrap"
          >
            <Zap className="h-4 w-4" />
            Place Bid
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-on-surface-variant mt-2 text-center">
        Bidding will approve {market.borrow_asset.symbol} and transfer it on-chain in two steps.
      </p>
    </Card>
  );
}

// ─── Summary stat strip ───────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/20 bg-surface-container p-4">
      <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold mono ${highlight ? "text-red-400" : "text-on-surface"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PROTECTIONS = [
  { label: "Dutch Auction Mechanism", desc: "Price decays linearly — first bid wins all collateral.", ok: true },
  { label: "Reserve Price Floor", desc: "Auction stops at 80% of original debt; no distressed fire-sale below floor.", ok: true },
  { label: "Two-Step Bid Flow", desc: "ERC-20 approval + bid in one guided flow.", ok: true },
];

export default function LiquidationPage() {
  const { data: liquidations, isLoading } = useLiquidations();

  const liquidatableMarkets =
    liquidations?.markets?.filter((m) => !m.is_liquidating) ?? [];
  const activeAuctionMarkets =
    liquidations?.markets?.filter((m) => m.is_liquidating) ?? [];

  const hasAnything =
    liquidatableMarkets.length > 0 || activeAuctionMarkets.length > 0;

  // Markets at risk can carry different borrow assets/decimals, so sum per
  // asset symbol from each market's own total_debt rather than trusting the
  // backend's single pre-blended liquidations.total_debt figure.
  const totalDebtByAsset = (() => {
    const bySymbol: Record<string, number> = {};
    [...liquidatableMarkets, ...activeAuctionMarkets].forEach((m) => {
      const amount = Number(formatUnits(BigInt(m.total_debt || "0"), m.borrow_asset.decimals));
      bySymbol[m.borrow_asset.symbol] = (bySymbol[m.borrow_asset.symbol] ?? 0) + amount;
    });
    return Object.entries(bySymbol)
      .filter(([, amount]) => amount !== 0)
      .map(([symbol, amount]) => ({ symbol, amount }));
  })();

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-350 mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
            Protocol Safety
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">Liquidation Center</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Monitor under-collateralized positions and participate in Dutch auction settlements.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-on-surface-variant">
            Live · refreshes every 15s
          </span>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <StatChip
            label="Markets at Risk"
            value={liquidatableMarkets.length.toString()}
            highlight={liquidatableMarkets.length > 0}
          />
          <StatChip
            label="Active Auctions"
            value={activeAuctionMarkets.length.toString()}
          />
          <StatChip
            label="Total Debt at Risk"
            value={formatAssetAmounts(totalDebtByAsset, 0)}
          />
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : !hasAnything ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-28 rounded-xl border border-outline-variant/20 bg-surface-container/30 text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-emerald-400/60" />
          </div>
          <div>
            <p className="text-base font-semibold text-on-surface">All Positions Healthy</p>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
              No markets are currently eligible for liquidation. Positions will appear
              here when collateral health drops below the liquidation threshold.
            </p>
          </div>

          <div className="mt-2 w-full max-w-xs text-left rounded-lg border border-outline-variant/20 bg-surface-container p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
              Protocol Safeguards
            </p>
            <div className="space-y-2">
              {PROTECTIONS.map(({ label, desc, ok }) => (
                <div key={label} className="flex items-start gap-2">
                  <ShieldCheck className={`h-4 w-4 shrink-0 mt-0.5 ${ok ? "text-emerald-400" : "text-amber-400"}`} />
                  <div>
                    <p className="text-xs font-medium text-on-surface">{label}</p>
                    <p className="text-xs text-on-surface-variant">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Markets eligible for liquidation ── */}
          {liquidatableMarkets.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
                  Eligible for Liquidation
                </h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold">
                  {liquidatableMarkets.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liquidatableMarkets.map((market) => (
                  <LiquidatableMarketCard key={market.address} market={market} />
                ))}
              </div>
            </section>
          )}

          {/* ── Active auctions ── */}
          {activeAuctionMarkets.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
                  Active Auctions
                </h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                  {activeAuctionMarkets.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeAuctionMarkets.map((market, idx) => (
                  <ActiveAuctionCard
                    key={market.address}
                    auctionId={idx + 1}
                    market={market}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Safeguards panel ── */}
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
              Protocol Safeguards
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROTECTIONS.map(({ label, desc, ok }) => (
                <div key={label} className="flex items-start gap-2">
                  <ShieldCheck className={`h-4 w-4 shrink-0 mt-0.5 ${ok ? "text-emerald-400" : "text-amber-400"}`} />
                  <div>
                    <p className="text-xs font-medium text-on-surface">{label}</p>
                    <p className="text-xs text-on-surface-variant">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
