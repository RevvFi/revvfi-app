"use client";

import { useState } from "react";
import { useLiquidations, useAuction, useAuctionPrice, useCountdown, usePlaceBid } from "@/hooks/useAuctions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatAddress, formatCountdown } from "@/lib/utils";
import { Filter, History, Zap, ShieldCheck } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function AuctionCard({ auctionId, onSelect, selected }: { auctionId: number; onSelect: () => void; selected: boolean }) {
  const { data: auction, isLoading } = useAuction(auctionId);
  const { data: priceData } = useAuctionPrice(auctionId);
  const remaining = useCountdown(auction?.end_time ?? 0);
  const isUrgent = remaining < 3600 && remaining > 0;

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!auction) return null;

  const currentPrice = priceData?.current_price ?? auction.current_price;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-4 transition-all ${selected ? "border-primary-container/60 bg-primary-container/10" : "border-outline-variant/20 bg-surface-container hover:border-outline-variant/40"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-on-surface-variant">AUC-{auction.auction_id}</span>
        <span className={`text-xs font-bold mono ${isUrgent ? "text-red-400" : "text-on-surface"}`}>
          {formatCountdown(remaining)}
        </span>
      </div>
      <p className="text-sm font-bold text-on-surface mb-1">
        ETH Vault #{auction.auction_id}
      </p>
      <div className="flex justify-between text-xs text-on-surface-variant">
        <span>Current Price</span>
        <span className={`mono font-medium ${isUrgent ? "text-red-400" : "text-on-surface"}`}>
          ${(parseFloat(currentPrice) / 1e6).toFixed(2)}M
          <span className="text-red-400 ml-1">-{Math.floor(Math.random() * 15 + 5)}%</span>
        </span>
      </div>
      <StatusBadge status={auction.status} className="mt-2" />
    </button>
  );
}

const DECAY_CURVE = Array.from({ length: 24 }, (_, i) => ({
  time: `T-${24 - i}h`,
  price: 66900 - i * (66900 - 58200) / 23,
}));

const PROTECTIONS = [
  { label: "Vault Escrow", desc: "Assets are locked in multi-sig vault.", ok: true },
  { label: "Slippage Guard", desc: "Max 1% impact per transaction.", ok: true },
  { label: "MEV Protection", desc: "RPC-endpoint integration active.", ok: false },
];

export default function AuctionsPage() {
  const { data: liquidations, isLoading } = useLiquidations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const placeBid = usePlaceBid();

  const { data: selectedAuction } = useAuction(selectedId ?? 0);
  const { data: selectedPrice } = useAuctionPrice(selectedId ?? 0);
  const remaining = useCountdown(selectedAuction?.end_time ?? 0);

  // Derive auction IDs from liquidating markets — empty array when backend has no data
  const allAuctionIds = liquidations?.markets.map((_, i) => i + 1) ?? [];
  const hasAuctions = allAuctionIds.length > 0;

  async function handleBid() {
    if (!selectedId || !bidAmount || !selectedAuction) return;
    const auctionMarket = liquidations?.markets.find(
      (m) => m.address === selectedAuction.market_address
    );
    await placeBid.mutateAsync({
      auctionId: selectedId,
      bidAmount,
      borrowAssetAddress: auctionMarket?.borrow_asset.address ?? "",
      borrowAssetDecimals: auctionMarket?.borrow_asset.decimals ?? 18,
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
            Active Marketplace
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">Liquidation Auctions</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            High-precision Dutch auctions for distressed institutional assets. Fair value discovery through time-based price decay.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter Assets</Button>
          <Button variant="secondary" size="sm" className="gap-1.5"><History className="h-3.5 w-3.5" /> Auction History</Button>
        </div>
      </div>

      {isLoading ? (
        /* Skeleton placeholders — only shown while the initial fetch is in-flight */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        /* Clean empty state — no shimmer, no broken cards */
        <div className="flex flex-col items-center justify-center py-28 rounded-xl border border-outline-variant/20 bg-surface-container/30 text-center gap-3">
          <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center">
            <Zap className="h-8 w-8 text-on-surface-variant/30" />
          </div>
          <div>
            <p className="text-base font-semibold text-on-surface">No Active Auctions</p>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
              Liquidation auctions appear here when a borrower&apos;s collateral health drops below the liquidation threshold.
            </p>
          </div>
          <div className="mt-4 w-full max-w-xs text-left rounded-lg border border-outline-variant/20 bg-surface-container p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Auction Protections</p>
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
        /* Active auction grid — only rendered when the backend has real data */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {selectedAuction ? (
              <Card className="p-5">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-9 w-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 font-bold text-sm">W</div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">WBTC Vault #{selectedAuction.auction_id}</p>
                        <p className="text-xs text-on-surface-variant mono">{formatAddress(selectedAuction.market_address)} · Liquidation ID: AUC-{selectedAuction.auction_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Time Remaining</p>
                    <p className={`text-2xl font-bold mono ${remaining < 3600 ? "text-red-400" : "text-on-surface"}`}>
                      {formatCountdown(remaining)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant mb-1">Collateral Amount</p>
                    <p className="text-lg font-bold text-on-surface">{(parseFloat(selectedAuction.collateral_amount) / 1e18).toFixed(2)} ETH</p>
                    <p className="text-xs text-on-surface-variant">≈ $2.845M</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant mb-1">Current Price</p>
                    <p className="text-lg font-bold text-on-surface mono">${(parseFloat(selectedPrice?.current_price ?? selectedAuction.current_price) / 1e6).toFixed(2)}M</p>
                    <p className="text-xs text-red-400">≈ -8.4% Market</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant mb-1">Min. Required Bid</p>
                    <p className="text-lg font-bold text-on-surface">1.5 WBTC</p>
                    <p className="text-xs text-on-surface-variant">Increment: 0.1 WBTC</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Price Decay Curve</p>
                    <p className="text-xs text-on-surface-variant">Linear Decay Rate: 1.5% per hour</p>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={DECAY_CURVE}>
                      <defs>
                        <linearGradient id="decayGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fill: "#e4beb3", fontSize: 9 }} axisLine={false} tickLine={false} interval={5} />
                      <YAxis hide domain={[55000, 70000]} />
                      <Tooltip contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", color: "#fadcd4", borderRadius: 8 }}
                        formatter={(v: number) => [`$${(v / 1000).toFixed(1)}K`, "Price"]} />
                      <Area type="monotone" dataKey="price" stroke="#ff5a1f" strokeWidth={2} fill="url(#decayGrad)" dot={false}
                        label={{ value: "CURRENT", position: "insideTopRight", fill: "#ff5a1f", fontSize: 10 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                    <span>T-0h (START: $66,900)</span>
                    <span>T-24h (END: $58,200)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    label="Bid Amount"
                    type="number"
                    placeholder="2.5"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    suffix="ETH"
                    className="flex-1"
                  />
                  <div className="flex flex-col justify-end">
                    <Button size="lg" onClick={handleBid} loading={placeBid.isPending} className="gap-2" disabled={!bidAmount}>
                      <Zap className="h-4 w-4" />
                      Place Instant Bid
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary-container" />
                </div>
                <p className="text-sm text-on-surface">Select an auction from the sidebar to place a bid</p>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allAuctionIds.filter((id) => id !== selectedId).map((id) => (
                <AuctionCard key={id} auctionId={id} onSelect={() => setSelectedId(id)} selected={false} />
              ))}
            </div>

            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Auction Protections</p>
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
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400 pulse-dot" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Live Bid History</p>
                </div>
                <span className="text-xs text-on-surface-variant">Bids: {liquidations?.count ?? 0}</span>
              </div>
              <div className="space-y-3">
                {[
                  { bidder: "Inst. Liquidator Alpha", addr: "0x992...f8a2", amount: "+1.2 WBTC", time: "2 mins ago" },
                  { bidder: "MEV Relay 440", addr: "0x331...99e1", amount: "+0.8 WBTC", time: "5 mins ago" },
                  { bidder: "Whale Vault V3", addr: "0xbfd...11c4", amount: "+2.5 WBTC", time: "12 mins ago" },
                ].map(({ bidder, addr, amount, time }) => (
                  <div key={addr} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-outline-variant/20 flex items-center justify-center text-xs text-on-surface-variant shrink-0">
                      {bidder[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-on-surface truncate">{bidder}</p>
                      <p className="text-xs mono text-on-surface-variant">{addr}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-400">{amount}</p>
                      <p className="text-xs text-on-surface-variant">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-primary-container/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Your Bid Balance</p>
              <p className="text-2xl font-bold text-primary mono">4.120 WBTC</p>
              <Button className="w-full mt-3 gap-2" size="sm">
                Add More Funds →
              </Button>
            </Card>

            <Card className="p-3 flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />Nodes: 100% Sync</span>
              <span>Gas: 12 Gwei</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" />Auto-Liquidator Active</span>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
