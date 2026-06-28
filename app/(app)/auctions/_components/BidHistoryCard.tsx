"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress } from "@/lib/utils";
import { auctionService } from "@/services/auction.service";
import type { AuctionBid } from "@/types";

function formatTimeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function BidHistoryCard({ auctionId }: { auctionId: number | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["auction-bids", auctionId],
    queryFn: async () => {
      if (!auctionId) return { bids: [], count: 0 };
      try {
        return await auctionService.getAuctionBids(auctionId);
      } catch {
        return { bids: [], count: 0 };
      }
    },
    enabled: !!auctionId,
    refetchInterval: 10_000,
  });

  const bids = data?.bids ?? [];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Live Bid History
          </p>
        </div>
        <span className="text-xs text-on-surface-variant">{bids.length} bids</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : bids.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-6">
          No bids placed yet
        </p>
      ) : (
        <div className="space-y-3">
          {bids.map((bid: AuctionBid) => {
            const amountFormatted = (parseFloat(bid.amount) / 1e6).toFixed(2);
            return (
              <div key={bid.bid_id} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-outline-variant/20 flex items-center justify-center text-xs text-on-surface-variant shrink-0 font-bold">
                  {bid.bidder.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-on-surface mono truncate">
                    {formatAddress(bid.bidder)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {formatTimeAgo(bid.timestamp)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-400 mono">${amountFormatted}</p>
                  <p className="text-[10px] text-on-surface-variant">USDC</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
