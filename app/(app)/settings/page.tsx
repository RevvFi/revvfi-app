"use client";

import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";
import { WalletPrompt } from "@/components/wallet-gate";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { useMyOffers, useCancelOffer } from "@/hooks/useOffers";
import { useOfferBookMarketMap } from "@/hooks/useOfferBookMarketMap";
import { useMyBids, useSettleAuction, useCanSettle } from "@/hooks/useAuctions";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, fmtUSD, formatAPR, formatTimestamp, formatCountdown, formatAssetAmounts } from "@/lib/utils";
import { formatUnits } from "viem";
import { CHAIN_NAMES } from "@/constants/chains";
import {
  LogOut, Wallet,
  FileText, CheckCircle2, XCircle, Clock, Trash2,
  Award, CheckCircle, Loader2, Gavel,
} from "lucide-react";
import type { Auction } from "@/types";

export default function SettingsPage() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useSIWE();
  const { theme, setTheme } = useTheme();

  // My Offers data
  const { data: myOffersData, isLoading: offersLoading } = useMyOffers(address);
  const cancelOfferMutation = useCancelOffer();
  const { map: offerBookMarketMap } = useOfferBookMarketMap();

  const myOffers = myOffersData?.offers ?? [];
  const activeOffers = myOffers.filter((o) => o.status === "active" || o.status === "partially_filled");
  const filledOffers = myOffers.filter((o) => o.status === "filled");
  // Offers can span markets with different borrow assets/decimals, so sum
  // per-asset (via the OfferBook->Market reverse lookup) rather than a single
  // raw total assuming a fixed decimals count.
  const activeLiquidityByAsset = (() => {
    const bySymbol: Record<string, { amount: number; decimals: number }> = {};
    activeOffers.forEach((o) => {
      const market = offerBookMarketMap[(o.market_address || "").toLowerCase()];
      const decimals = market?.borrow_asset.decimals ?? 6;
      const symbol = market?.borrow_asset.symbol ?? "?";
      const amount = Number(formatUnits(BigInt(o.remaining_amount || o.amount || "0"), decimals));
      bySymbol[symbol] = { decimals, amount: (bySymbol[symbol]?.amount ?? 0) + amount };
    });
    return Object.entries(bySymbol)
      .filter(([, v]) => v.amount !== 0)
      .map(([symbol, v]) => ({ symbol, amount: v.amount }));
  })();

  async function handleLogout() {
    await logout();
    disconnect();
  }

  async function handleCancelOffer(offerId: number, offerBookAddress: string) {
    if (!confirm("Are you sure you want to cancel this offer?")) return;
    try {
      await cancelOfferMutation.mutateAsync({ offerId, offerBookAddress });
    } catch (error) {
      console.error("Cancel offer failed:", error);
    }
  }

  if (!isConnected) {
    return (
      <WalletPrompt
        title="Connect your wallet"
        description="Connect your wallet to manage your account, preferences, offers, and auction bids."
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Account</p>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full bg-primary-container/15 flex items-center justify-center shrink-0">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-on-surface mono truncate">{address ?? "Not connected"}</p>
            <p className="text-xs text-on-surface-variant capitalize">{user?.role ?? "Guest"}</p>
          </div>
          {isAuthenticated && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Authenticated
            </span>
          )}
        </div>
        <div className="border-t border-outline-variant/20 pt-4 flex gap-3">
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-3.5 w-3.5" /> Sign Out & Disconnect
          </Button>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Preferences</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-surface-container-low flex items-center justify-center">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-on-surface-variant" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">Appearance</p>
              <p className="text-xs text-on-surface-variant capitalize">{theme} mode</p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none ${
              theme === "light" ? "bg-primary" : "bg-outline"
            }`}
            role="switch"
            aria-checked={theme === "light"}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                theme === "light" ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* My Offers */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">My Offers</p>
          {!offersLoading && myOffers.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">Active Liquidity</p>
                <p className="text-sm font-bold text-primary mono">
                  {formatAssetAmounts(activeLiquidityByAsset, 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">Total Offers</p>
                <p className="text-sm font-bold text-on-surface mono">{myOffers.length}</p>
              </div>
            </div>
          )}
        </div>

        {offersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : myOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-outline-variant/20 bg-surface-container/30">
            <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-on-surface-variant/50" />
            </div>
            <p className="text-sm font-medium text-on-surface">No offers yet</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Create an offer on the Lend page to start earning
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {myOffers.map((offer) => {
              const isActive = offer.status === "active";
              const isPartial = offer.status === "partially_filled";
              const isFilled = offer.status === "filled";
              const isCancelled = offer.status === "cancelled";
              const canCancel = isActive || isPartial;

              const statusIcon = isFilled ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : isCancelled ? (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
              );

              const statusColor = isFilled
                ? "bg-emerald-500/10 text-emerald-400"
                : isCancelled
                  ? "bg-red-500/10 text-red-400"
                  : isPartial
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-blue-500/10 text-blue-400";

              const statusLabel = isFilled
                ? "FILLED"
                : isCancelled
                  ? "CANCELLED"
                  : isPartial
                    ? "PARTIAL"
                    : offer.status === "expired"
                      ? "EXPIRED"
                      : "ACTIVE";

              return (
                <div
                  key={offer.offer_id}
                  className="p-3 rounded-lg border border-outline-variant/20 bg-surface-container/50 hover:bg-surface-container transition-colors"
                >
                  <div className="space-y-2">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {statusIcon}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            Offer #{offer.offer_id}
                          </p>
                          <p className="text-xs text-on-surface-variant mono">
                            {formatAddress(offer.market_address)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-surface-container-low rounded p-2">
                        <p className="text-[10px] text-on-surface-variant mb-0.5">Amount</p>
                        <p className="text-sm font-bold text-on-surface mono">
                          {fmtUSD(offer.amount)}
                        </p>
                      </div>
                      <div className="bg-surface-container-low rounded p-2">
                        <p className="text-[10px] text-on-surface-variant mb-0.5">APR</p>
                        <p className="text-sm font-bold text-primary mono">
                          {formatAPR(offer.apr)}
                        </p>
                      </div>
                      <div className="bg-surface-container-low rounded p-2">
                        <p className="text-[10px] text-on-surface-variant mb-0.5">
                          {canCancel ? "Remaining" : "Filled"}
                        </p>
                        <p className="text-sm font-bold text-on-surface mono">
                          {canCancel
                            ? fmtUSD(offer.remaining_amount || offer.amount)
                            : fmtUSD(offer.filled_amount || offer.amount)}
                        </p>
                      </div>
                    </div>

                    {/* Partially filled banner */}
                    {isPartial && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2">
                        <p className="text-xs text-amber-400 font-medium">
                          Partially filled · {fmtUSD(offer.filled_amount)} borrowed so far
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span>{offer.seniority === 0 ? "Senior" : "Junior"}</span>
                        <span>·</span>
                        <span>{formatTimestamp(offer.created_at)}</span>
                      </div>
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2 gap-1.5"
                          onClick={() => handleCancelOffer(offer.offer_id, offer.market_address)}
                          loading={cancelOfferMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary footer */}
        {myOffers.length > 0 && (
          <div className="border-t border-outline-variant/20 pt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-on-surface-variant mb-0.5">Active</p>
              <p className="text-base font-bold text-blue-400">{activeOffers.length}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant mb-0.5">Filled</p>
              <p className="text-base font-bold text-emerald-400">{filledOffers.length}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant mb-0.5">Best APR</p>
              <p className="text-base font-bold text-primary">
                {activeOffers.length > 0
                  ? formatAPR(Math.max(...activeOffers.map((o) => o.apr)))
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* My Bids */}
      <MyBidsSection address={address} />

      {/* Notifications */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Notifications</p>
        {[
          { label: "Liquidation Warnings", desc: "Alert when health factor drops below 1.3" },
          { label: "Offer Filled", desc: "Notify when your lending offers are accepted" },
          { label: "Position Settled", desc: "Notify when positions reach maturity" },
          { label: "Auction Updates", desc: "Real-time bid updates on active auctions" },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">{label}</p>
              <p className="text-xs text-on-surface-variant">{desc}</p>
            </div>
            <span className="text-xs text-on-surface-variant/60 rounded-full border border-outline-variant/20 px-2 py-1">Coming soon</span>
          </div>
        ))}
      </Card>

      {/* Network */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Network</p>
        <div className="space-y-2">
          {[1, 11155111, 31337].map((id) => {
            const active = chain?.id === id;
            return (
              <div key={id} className={`flex items-center gap-3 rounded-lg p-3 border ${active ? "border-primary-container/40 bg-primary-container/10" : "border-outline-variant/20"}`}>
                <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-outline-variant"}`} />
                <span className="text-sm text-on-surface">{CHAIN_NAMES[id] ?? `Chain ${id}`}</span>
                {active && <span className="ml-auto text-xs text-primary">Active</span>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* API / Env info */}
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">API Configuration</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Backend URL</span>
            <span className="mono text-xs text-on-surface">{process.env.NEXT_PUBLIC_API_URL}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Auth Status</span>
            <span className={isAuthenticated ? "text-emerald-400" : "text-on-surface-variant"}>
              {isAuthenticated ? "Authenticated" : "Not authenticated"}
            </span>
          </div>
        </div>
      </Card>

      {/* Legal */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
        {[
          { href: "/about", label: "About" },
          { href: "/team", label: "Team" },
          { href: "/invest", label: "Invest" },
          { href: "/contribute", label: "Contribute" },
          { href: "/contact", label: "Contact" },
          { href: "/terms", label: "Terms" },
          { href: "/privacy", label: "Privacy" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── My Bids Section ──────────────────────────────────────────────────────────

function MyBidsSection({ address }: { address?: string }) {
  const { data: myBids, isLoading } = useMyBids(address);
  const { mutate: settleAuction, isPending: isSettling } = useSettleAuction();

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-amber-400" />
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">My Auction Bids</p>
        {!isLoading && myBids && myBids.length > 0 && (
          <span className="ml-auto text-xs text-on-surface-variant">{myBids.length} bid{myBids.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : !myBids || myBids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-lg border border-outline-variant/20 bg-surface-container/30">
          <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
            <Gavel className="h-6 w-6 text-on-surface-variant/40" />
          </div>
          <p className="text-sm font-medium text-on-surface">No auction bids yet</p>
          <p className="text-xs text-on-surface-variant mt-1">Place a bid on the Auctions page</p>
          <Link href="/auctions" className="mt-3">
            <Button variant="secondary" size="sm">Browse Auctions</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {myBids.map((auction: Auction) => (
            <BidCard
              key={auction.auction_id}
              auction={auction}
              userAddress={address}
              onSettle={() => settleAuction({ auctionId: auction.auction_id })}
              isSettling={isSettling}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function BidCard({
  auction,
  userAddress,
  onSettle,
  isSettling,
}: {
  auction: Auction;
  userAddress?: string;
  onSettle: () => void;
  isSettling: boolean;
}) {
  const settlementInfo = useCanSettle(auction, userAddress);
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = Math.max(0, auction.end_time - now);

  const debtDecimals = auction.borrow_asset?.decimals ?? 6;
  const collateralDecimals = auction.collateral_asset?.decimals ?? 18;
  const debtSymbol = auction.borrow_asset?.symbol ?? "USDC";
  const collateralSymbol = auction.collateral_asset?.symbol ?? "WETH";

  const bidAmountFmt = formatUnits(BigInt(auction.highest_bid || "0"), debtDecimals);
  const collateralAmountFmt = parseFloat(
    formatUnits(BigInt(auction.collateral_amount), collateralDecimals)
  ).toFixed(4);

  const isWinning =
    auction.highest_bidder?.toLowerCase() === userAddress?.toLowerCase();

  return (
    <div className="p-3 rounded-lg border border-outline-variant/20 bg-surface-container/50 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-on-surface">Auction #{auction.auction_id}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              auction.status === "active" ? "bg-blue-500/10 text-blue-400" :
              auction.status === "settled" ? "bg-emerald-500/10 text-emerald-400" :
              "bg-outline-variant/20 text-on-surface-variant"
            }`}>{auction.status}</span>
            {isWinning && auction.status === "active" && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Winning</span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant mono mt-0.5">{formatAddress(auction.market_address)}</p>
        </div>
        <Link href="/auctions">
          <Button variant="ghost" size="sm" className="text-xs text-on-surface-variant hover:text-on-surface h-7 px-2">View →</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container-low rounded p-2">
          <p className="text-[10px] text-on-surface-variant mb-0.5">Your Bid</p>
          <p className="text-sm font-bold text-on-surface mono">{parseFloat(bidAmountFmt).toFixed(2)} {debtSymbol}</p>
        </div>
        <div className="bg-surface-container-low rounded p-2">
          <p className="text-[10px] text-on-surface-variant mb-0.5">You&apos;ll Receive</p>
          <p className="text-sm font-bold text-emerald-400 mono">{collateralAmountFmt} {collateralSymbol}</p>
        </div>
      </div>

      {auction.status === "active" && (
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Clock className="h-3 w-3" />
          {timeRemaining > 0 ? `Ends in ${formatCountdown(timeRemaining)}` : "Ended — ready to settle"}
        </div>
      )}

      {auction.status === "active" && settlementInfo.canSettle && (
        <Button size="sm" className="w-full gap-2" onClick={onSettle} disabled={isSettling}>
          {isSettling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Award className="h-3 w-3" />}
          Settle &amp; Claim {collateralAmountFmt} {collateralSymbol}
        </Button>
      )}

      {auction.status === "active" && !settlementInfo.canSettle && (
        <p className="text-xs text-on-surface-variant bg-surface-container-low rounded p-2">
          ⏳ {settlementInfo.reason}
        </p>
      )}

      {auction.status === "settled" && (
        <div className="flex items-center gap-2 rounded p-2 bg-emerald-500/8 text-xs text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          Settled — Collateral claimed
        </div>
      )}
    </div>
  );
}
