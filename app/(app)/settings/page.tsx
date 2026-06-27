"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { useMyOffers, useCancelOffer } from "@/hooks/useOffers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, fmtUSD, formatAPR, formatTimestamp } from "@/lib/utils";
import {
  LogOut, Wallet,
  FileText, CheckCircle2, XCircle, Clock, Trash2,
} from "lucide-react";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useSIWE();

  // My Offers data
  const { data: myOffersData, isLoading: offersLoading } = useMyOffers(address);
  const cancelOfferMutation = useCancelOffer();

  const myOffers = myOffersData?.offers ?? [];
  const activeOffers = myOffers.filter((o) => o.status === "active" || o.status === "partially_filled");
  const filledOffers = myOffers.filter((o) => o.status === "filled");
  const totalLiquidityRaw = activeOffers.reduce(
    (sum, o) => sum + parseFloat(o.remaining_amount || o.amount),
    0,
  );

  async function handleLogout() {
    await logout();
    disconnect();
  }

  async function handleCancelOffer(offerId: number, marketAddress: string) {
    if (!confirm("Are you sure you want to cancel this offer?")) return;
    try {
      await cancelOfferMutation.mutateAsync({ offerId, marketAddress });
    } catch (error) {
      console.error("Cancel offer failed:", error);
    }
  }

  if (!isConnected) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center">
          <Wallet className="h-8 w-8 text-on-surface-variant" />
        </div>
        <p className="text-lg font-semibold text-on-surface">Wallet not connected</p>
        <p className="text-sm text-on-surface-variant">Connect your wallet to view settings</p>
      </div>
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

      {/* My Offers */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">My Offers</p>
          {!offersLoading && myOffers.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">Active Liquidity</p>
                <p className="text-sm font-bold text-primary mono">
                  ${(totalLiquidityRaw / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
            <button className="h-6 w-11 rounded-full bg-primary-container transition-colors relative">
              <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform" />
            </button>
          </div>
        ))}
      </Card>

      {/* Network */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Network</p>
        <div className="space-y-2">
          {[
            { id: 1, name: "Ethereum Mainnet", active: true },
            { id: 11155111, name: "Sepolia Testnet", active: false },
            { id: 31337, name: "Local Development", active: false },
          ].map(({ id, name, active }) => (
            <div key={id} className={`flex items-center gap-3 rounded-lg p-3 border ${active ? "border-primary-container/40 bg-primary-container/10" : "border-outline-variant/20"}`}>
              <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-outline-variant"}`} />
              <span className="text-sm text-on-surface">{name}</span>
              {active && <span className="ml-auto text-xs text-primary">Active</span>}
            </div>
          ))}
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
    </div>
  );
}
