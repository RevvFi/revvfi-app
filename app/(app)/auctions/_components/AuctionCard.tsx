"use client";

import { formatCountdown } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import type { Auction } from "@/types";

interface AuctionCardProps {
  auction: Auction;
  onSelect: () => void;
  selected: boolean;
}

export function AuctionCard({ auction, onSelect, selected }: AuctionCardProps) {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Math.max(0, auction.end_time - now);
  const isUrgent = remaining < 3600;

  const duration = auction.end_time - auction.start_time;
  const elapsed = now - auction.start_time;
  const discount = duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0;

  const collateralDecimals = auction.collateral_asset?.decimals ?? 18;
  const debtDecimals = auction.borrow_asset?.decimals ?? 6;
  const collateralSymbol = auction.collateral_asset?.symbol ?? "WETH";
  const debtSymbol = auction.borrow_asset?.symbol ?? "USDC";

  const collateralNum = parseFloat(auction.collateral_amount) / 10 ** collateralDecimals;
  const debtNum = parseFloat(auction.debt_amount) / 10 ** debtDecimals;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-4 transition-all ${
        selected
          ? "border-primary-container/60 bg-primary-container/10"
          : "border-outline-variant/20 bg-surface-container hover:border-outline-variant/40"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-on-surface-variant">AUC-{auction.auction_id}</span>
        <span className={`text-xs font-bold mono ${isUrgent ? "text-red-400" : "text-on-surface"}`}>
          {formatCountdown(remaining)}
        </span>
      </div>

      <p className="text-sm font-bold text-on-surface mb-2">
        {collateralSymbol} / {debtSymbol}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-[10px] text-on-surface-variant">Collateral</p>
          <p className="text-xs font-medium text-on-surface mono">
            {collateralNum.toFixed(2)} {collateralSymbol}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant">Debt</p>
          <p className="text-xs font-medium text-on-surface mono">
            {debtNum.toFixed(2)} {debtSymbol}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={auction.status} />
        {discount > 0 && (
          <span className="text-xs font-bold text-orange-400 mono">{discount.toFixed(1)}% off</span>
        )}
      </div>
    </button>
  );
}
