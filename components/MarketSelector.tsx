"use client";

import { useAccount } from "wagmi";
import { useMarkets } from "@/hooks/useMarkets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { TokenPair } from "@/components/TokenIcon";
import { formatAddress } from "@/lib/utils";
import { AlertCircle, TrendingUp } from "lucide-react";

interface MarketSelectorProps {
  value: string | null;
  onValueChange: (value: string) => void;
  showBadge?: boolean;
  className?: string;
  filterByBorrower?: boolean;
  filterByLender?: boolean;
}

export function MarketSelector({
  value,
  onValueChange,
  showBadge = true,
  className,
  filterByBorrower = false,
  filterByLender = false,
}: MarketSelectorProps) {
  const { address } = useAccount();
  const { data: marketsData, isLoading } = useMarkets();

  let markets = marketsData?.markets ?? [];

  if (filterByBorrower && address) {
    markets = markets.filter((m) => m.borrower.toLowerCase() === address.toLowerCase());
  } else if (filterByLender && address) {
    markets = markets.filter((m) => m.borrower.toLowerCase() !== address.toLowerCase());
  }

  const selectedMarket = markets.find((m) => m.address === value);

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  if (!markets.length) {
    const emptyMessage = filterByBorrower
      ? "No markets are assigned to your address yet. Contact admin to create a market for you."
      : filterByLender
      ? "No markets are available for lending at this time."
      : "No lending markets have been deployed yet.";

    return (
      <div className={`rounded-lg border border-outline-variant/30 bg-surface-container p-4 flex items-start gap-3 ${className ?? ""}`}>
        <AlertCircle className="h-4 w-4 text-on-surface-variant shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-on-surface">No markets available</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Select value={value ?? undefined} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a market…">
            {selectedMarket && (
              <div className="flex items-center gap-2">
                <TokenPair
                  from={selectedMarket.collateral_asset.symbol}
                  to={selectedMarket.borrow_asset.symbol}
                  size="xs"
                />
                <span>
                  {selectedMarket.collateral_asset.symbol} → {selectedMarket.borrow_asset.symbol}
                </span>
                <span className="text-xs text-on-surface-variant mono hidden sm:block">
                  {formatAddress(selectedMarket.address)}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {markets.map((market) => (
            <SelectItem key={market.address} value={market.address}>
              <div className="flex items-center gap-2 py-0.5">
                <TokenPair
                  from={market.collateral_asset.symbol}
                  to={market.borrow_asset.symbol}
                  size="xs"
                />
                <span className="font-medium">
                  {market.collateral_asset.symbol} → {market.borrow_asset.symbol}
                </span>
                <span className="text-xs text-on-surface-variant mono">
                  {formatAddress(market.address)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMarket && showBadge && (
        <div className="mt-3 rounded-lg border border-outline-variant/20 bg-surface-container p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Selected Market</p>
            <StatusBadge status={selectedMarket.is_active ? "active" : "inactive"} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <span className="text-on-surface-variant">Collateral</span>
            <span className="text-on-surface font-medium">{selectedMarket.collateral_asset.symbol}</span>
            <span className="text-on-surface-variant">Borrow Asset</span>
            <span className="text-on-surface font-medium">{selectedMarket.borrow_asset.symbol}</span>
            <span className="text-on-surface-variant">Borrower</span>
            <span className="text-on-surface mono">{formatAddress(selectedMarket.borrower)}</span>
            {selectedMarket.weighted_apr !== undefined && (
              <>
                <span className="text-on-surface-variant flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Avg APR
                </span>
                <span className="text-primary font-semibold">
                  {(selectedMarket.weighted_apr / 100).toFixed(2)}%
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketBadge({ marketAddress }: { marketAddress: string }) {
  const { address } = useAccount();
  const { data: marketsData } = useMarkets();
  const market = marketsData?.markets.find((m) => m.address === marketAddress);

  if (!market || !address) return null;

  const isBorrower = market.borrower.toLowerCase() === address.toLowerCase();
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded text-[11px] font-semibold ${
      isBorrower
        ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
    }`}>
      {isBorrower ? "You: Borrower" : "You: Lender"}
    </span>
  );
}
