"use client";

import { useEffect, useState } from "react";
import { useLiquidations, useCountdown, usePlaceBid } from "@/hooks/useAuctions";
import { useDutchAuctionPrice } from "@/hooks/useLiquidation";
import { AuctionCard } from "./_components/AuctionCard";
import { BidHistoryCard } from "./_components/BidHistoryCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatAddress, formatCountdown, fmtUSD } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Filter, History, Zap, ShieldCheck, Gavel, TrendingDown, Activity } from "lucide-react";
import { formatUnits } from "viem";
import type { Auction } from "@/types";

const PROTECTIONS = [
  { label: "Dutch Auction Mechanism", desc: "Price decays linearly — first bid wins all collateral.", ok: true },
  { label: "Reserve Price Floor", desc: "Auction stops at 80% of original debt; no fire-sale below floor.", ok: true },
  { label: "Two-Step Bid Flow", desc: "ERC-20 approval + bid in one guided flow.", ok: true },
];

// ─── Main auction detail panel ────────────────────────────────────────────────

function AuctionDetailPanel({
  auction,
  bidAmount,
  setBidAmount,
}: {
  auction: Auction;
  bidAmount: string;
  setBidAmount: (v: string) => void;
}) {
  const remaining = useCountdown(auction.end_time);
  const { data: priceData } = useDutchAuctionPrice(auction);
  const placeBid = usePlaceBid();

  const isUrgent = remaining < 3600 && remaining > 0;
  const discount = priceData?.discount ?? 0;
  const currentPrice = priceData?.currentPrice ?? BigInt(0);

  const collateralDecimals = auction.collateral_asset?.decimals ?? 18;
  const debtDecimals = auction.borrow_asset?.decimals ?? 6;
  const collateralSymbol = auction.collateral_asset?.symbol ?? "WETH";
  const debtSymbol = auction.borrow_asset?.symbol ?? "USDC";

  const collateralNum = parseFloat(formatUnits(BigInt(auction.collateral_amount), collateralDecimals));
  const debtNum = parseFloat(formatUnits(BigInt(auction.debt_amount), debtDecimals));
  const currentPriceNum = parseFloat(formatUnits(currentPrice, debtDecimals));

  async function handleBid() {
    if (!bidAmount || parseFloat(bidAmount) <= 0) return;
    await placeBid.mutateAsync({
      auctionId: auction.auction_id,
      bidAmount,
      borrowAssetAddress: auction.borrow_asset?.address ?? "",
      borrowAssetDecimals: debtDecimals,
    });
    setBidAmount("");
  }

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <Gavel className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">
              AUC-{auction.auction_id} · {collateralSymbol} / {debtSymbol}
            </p>
            <p className="text-xs text-on-surface-variant mono">
              {formatAddress(auction.market_address)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Time Remaining
          </p>
          <p className={`text-2xl font-bold mono ${isUrgent ? "text-red-400" : "text-on-surface"}`}>
            {remaining > 0 ? formatCountdown(remaining) : "Ended"}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-xs text-on-surface-variant mb-1">Collateral Amount</p>
          <p className="text-lg font-bold text-on-surface mono">
            {collateralNum.toFixed(4)} {collateralSymbol}
          </p>
          <p className="text-xs text-on-surface-variant">≈ debt: {debtNum.toFixed(2)} {debtSymbol}</p>
        </div>
        <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 p-3">
          <p className="text-xs text-blue-400 mb-1">Current Price</p>
          <p className="text-lg font-bold text-blue-300 mono">
            {currentPriceNum.toFixed(2)} {debtSymbol}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingDown className="h-2.5 w-2.5 text-orange-400" />
            <p className="text-[10px] text-orange-400">{discount.toFixed(1)}% discount</p>
          </div>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-xs text-on-surface-variant mb-1">Highest Bid</p>
          <p className="text-lg font-bold text-on-surface mono">
            {auction.highest_bid && parseFloat(auction.highest_bid) > 0
              ? fmtUSD(auction.highest_bid, debtDecimals)
              : "—"}
          </p>
          {auction.highest_bidder && (
            <p className="text-xs text-on-surface-variant mono">
              {formatAddress(auction.highest_bidder)}
            </p>
          )}
        </div>
      </div>

      {/* Price decay progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Price Decay Progress
          </p>
          <p className="text-xs text-orange-400 mono">{discount.toFixed(1)}% elapsed</p>
        </div>
        <Progress value={discount} className="h-2" indicatorClassName="bg-orange-400" />
        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
          <span>Start: {debtNum.toFixed(2)} {debtSymbol}</span>
          <span>End: 0 {debtSymbol}</span>
        </div>
      </div>

      {/* Bid input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          label="Bid Amount"
          type="number"
          placeholder="0.00"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          suffix={debtSymbol}
          className="flex-1"
        />
        <div className="flex flex-col justify-end">
          <Button
            size="lg"
            onClick={handleBid}
            loading={placeBid.isPending}
            disabled={!bidAmount || parseFloat(bidAmount) <= 0}
            className="gap-2 whitespace-nowrap"
          >
            <Zap className="h-4 w-4" />
            Place Bid
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-on-surface-variant mt-2 text-center">
        Bidding will approve {debtSymbol} spend and place bid in two on-chain steps.
      </p>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuctionsPage() {
  const { data: liquidationsData, isLoading } = useLiquidations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState("");

  // Support both legacy shape (markets) and new shape (auctions) from API
  const auctions: Auction[] = liquidationsData?.auctions ?? [];
  const hasAuctions = auctions.length > 0;

  // Auto-select first auction once data loads
  useEffect(() => {
    if (auctions.length > 0 && !selectedId) {
      setSelectedId(auctions[0].auction_id);
    }
  }, [auctions, selectedId]);

  const selectedAuction = auctions.find((a) => a.auction_id === selectedId) ?? null;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
            Active Marketplace
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">Liquidation Auctions</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {hasAuctions
              ? `${auctions.length} active auction${auctions.length !== 1 ? "s" : ""} — Dutch price decay in progress`
              : "No active auctions right now"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-on-surface-variant">Live · 10s refresh</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <History className="h-3.5 w-3.5" /> History
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </div>
      ) : !hasAuctions ? (
        <div className="flex flex-col items-center justify-center py-28 rounded-xl border border-outline-variant/20 bg-surface-container/30 text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center">
            <Zap className="h-8 w-8 text-on-surface-variant/30" />
          </div>
          <div>
            <p className="text-base font-semibold text-on-surface">No Active Auctions</p>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
              Liquidation auctions appear here when collateral health drops below the liquidation threshold.
            </p>
          </div>
          <div className="mt-4 w-full max-w-xs text-left rounded-lg border border-outline-variant/20 bg-surface-container p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
              Auction Protections
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Detail + other auctions ── */}
          <div className="lg:col-span-2 space-y-4">
            {selectedAuction ? (
              <AuctionDetailPanel
                auction={selectedAuction}
                bidAmount={bidAmount}
                setBidAmount={setBidAmount}
              />
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <Gavel className="h-8 w-8 text-primary-container" />
                </div>
                <p className="text-sm text-on-surface">Select an auction from the list to place a bid</p>
              </Card>
            )}

            {/* Other auctions */}
            {auctions.filter((a) => a.auction_id !== selectedId).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {auctions
                  .filter((a) => a.auction_id !== selectedId)
                  .map((auction) => (
                    <AuctionCard
                      key={auction.auction_id}
                      auction={auction}
                      onSelect={() => setSelectedId(auction.auction_id)}
                      selected={false}
                    />
                  ))}
              </div>
            )}

            {/* Protections */}
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Auction Protections
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

          {/* ── Right: Sidebar ── */}
          <div className="space-y-4">
            <BidHistoryCard auctionId={selectedId} />

            {/* Auction selector list when multiple */}
            {auctions.length > 1 && (
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                  All Auctions ({auctions.length})
                </p>
                <div className="space-y-2">
                  {auctions.map((auction) => (
                    <AuctionCard
                      key={auction.auction_id}
                      auction={auction}
                      onSelect={() => setSelectedId(auction.auction_id)}
                      selected={auction.auction_id === selectedId}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* System status */}
            <Card className="p-3 flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live
              </span>
              <span>Indexer: active</span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" /> Dutch auction
              </span>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
