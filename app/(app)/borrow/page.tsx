"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  useBorrower,
  useBorrowerRisk,
  useBorrow,
  useRepay,
  useDepositCollateral,
  useWithdrawCollateral,
} from "@/hooks/useBorrower";
import { useRegisterBorrower } from "@/hooks/useArchController";
import { useRepayFull, useCloseMarket } from "@/hooks/useMarketActions";
import { useMarketHealth } from "@/hooks/useMarketMetrics";
import { usePositions } from "@/hooks/usePositions";
import { useMarkets } from "@/hooks/useMarkets";
import { useMarketOffers } from "@/hooks/useOffers";
import { useBestOffers, useTotalLiquidityAvailable, useActiveOfferCount } from "@/hooks/useOfferBookMetrics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR, formatTimestamp, fmtUSD } from "@/lib/utils";
import { HealthFactorRing } from "@/components/HealthFactorRing";
import { AlertTriangle, RefreshCw, ShieldCheck, Lock, TrendingUp, CheckCircle2, XCircle, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { MarketSelector } from "@/components/MarketSelector";
import { useMarketCollateralBalance, useMinCollateralRatio, useMarketTotalDebt, calculateMaxBorrow } from "@/hooks/useMarketCollateral";
import { formatUnits } from "viem";

function BorrowContent() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const { data: borrower, isLoading: borrowerLoading } = useBorrower(address ?? "");
  const { data: risk } = useBorrowerRisk(address ?? "");
  const { data: markets } = useMarkets({ is_active: true });
  const { data: positions } = usePositions();
  const registerMutation = useRegisterBorrower();
  const borrowMutation = useBorrow();
  const repayMutation = useRepay();
  const repayFullMutation = useRepayFull();
  const closeMarketMutation = useCloseMarket();
  const depositMutation = useDepositCollateral();
  const withdrawMutation = useWithdrawCollateral();

  const [selectedMarket, setSelectedMarket] = useState("");

  // Pre-select market when navigating from market detail page (?market=0x...)
  useEffect(() => {
    const marketParam = searchParams.get("market");
    if (marketParam) setSelectedMarket(marketParam);
  }, [searchParams]);
  const [useSeniorOnly, setUseSeniorOnly] = useState(false);

  // NEW: Real-time market health metrics from blockchain
  const marketHealth = useMarketHealth(selectedMarket as `0x${string}`);

  // NEW: Fetch market-specific collateral balance
  const { data: marketCollateral } = useMarketCollateralBalance(
    selectedMarket as `0x${string}`,
    address as `0x${string}`
  );

  // NEW: Fetch min collateral ratio and total debt
  const { data: minCollateralRatio } = useMinCollateralRatio(selectedMarket as `0x${string}`);
  const { data: totalDebt } = useMarketTotalDebt(selectedMarket as `0x${string}`);

  const [borrowAmount, setBorrowAmount] = useState("");
  const [maxAPR, setMaxAPR] = useState("1000");
  const [repayAmount, setRepayAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Prefer on-chain ratio when a market is selected (avoids stale/wrong backend value).
  // collateralRatio and minCollateralRatio are both in bps (e.g. 20600, 11000).
  // healthFactor = collateralRatio / minCollateralRatio  →  20600 / 11000 = 1.87
  const onChainHealthFactor =
    marketHealth.collateralRatio && minCollateralRatio && Number(minCollateralRatio) > 0
      ? Number(marketHealth.collateralRatio) / Number(minCollateralRatio)
      : null;
  const healthFactor = onChainHealthFactor ?? (risk?.health_factor ?? 0);
  const hfColor = healthFactor > 1.5 ? "text-emerald-400" : healthFactor > 1.2 ? "text-amber-400" : "text-red-400";

  const selectedMarketData = markets?.markets.find((m) => m.address === selectedMarket);

  // Check if connected user is the borrower of the selected market
  const isMarketBorrower = address && selectedMarketData &&
    address.toLowerCase() === selectedMarketData.borrower.toLowerCase();

  // NEW: Fetch all offers for the selected market (from database)
  const { data: marketOffers, isLoading: offersLoading } = useMarketOffers(selectedMarket);

  // NEW: Get real-time liquidity stats from blockchain
  const { data: totalLiquidity } = useTotalLiquidityAvailable(selectedMarket as `0x${string}`);
  const { data: offerCount } = useActiveOfferCount(selectedMarket as `0x${string}`);

  // NEW: Get borrow preview (updates as user types amount)
  const { data: borrowPreview, isLoading: previewLoading } = useBestOffers(
    selectedMarket as `0x${string}`,
    borrowAmount,
    selectedMarketData?.borrow_asset.decimals || 6,
    useSeniorOnly
  );

  // NEW: Calculate max borrow amount
  const collateralPriceUSD = BigInt(2000 * 1e8); // TODO: Fetch from oracle ($2000 WETH with 8 decimals)
  const maxBorrowWei = marketCollateral && minCollateralRatio
    ? calculateMaxBorrow(
        marketCollateral,
        collateralPriceUSD,
        minCollateralRatio,
        totalDebt || BigInt(0)
      )
    : BigInt(0);

  const maxBorrowFormatted = formatUnits(maxBorrowWei, selectedMarketData?.borrow_asset.decimals || 6);
  const collateralFormatted = marketCollateral
    ? formatUnits(marketCollateral, selectedMarketData?.collateral_asset.decimals || 18)
    : "0";

  // Calculate senior and junior liquidity breakdown
  const seniorLiquidity = marketOffers?.offers?.filter(o => o.seniority === 0)
    .reduce((sum, o) => sum + parseFloat(o.remaining_amount || o.amount), 0) || 0;
  const juniorLiquidity = marketOffers?.offers?.filter(o => o.seniority === 1)
    .reduce((sum, o) => sum + parseFloat(o.remaining_amount || o.amount), 0) || 0;
  const seniorOfferCount = marketOffers?.offers?.filter(o => o.seniority === 0).length || 0;
  const juniorOfferCount = marketOffers?.offers?.filter(o => o.seniority === 1).length || 0;

  // Find best available APR
  const bestAPR = (marketOffers?.offers && marketOffers.offers.length > 0)
    ? Math.min(...marketOffers.offers.map(o => o.apr))
    : 0;

  // Calculate accrued interest (simple interest calculation)
  const calculateAccruedInterest = () => {
    if (!borrower?.total_borrowed || !selectedMarketData || !borrower.last_activity) return 0;

    const principal = parseFloat(borrower.total_borrowed);
    const apr = selectedMarketData.weighted_apr; // in basis points (e.g., 1000 = 10%)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeElapsed = currentTime - borrower.last_activity; // seconds

    // Simple interest: (Principal × APR × Time) / Seconds in Year
    const aprDecimal = apr / 10000; // Convert bps to decimal
    const secondsPerYear = 365 * 24 * 60 * 60;
    const interest = (principal * aprDecimal * timeElapsed) / secondsPerYear;

    return Math.floor(interest);
  };

  const accruedInterest = calculateAccruedInterest();
  const totalDebtWithInterest = (parseFloat(borrower?.total_borrowed ?? "0") - parseFloat(borrower?.total_repaid ?? "0")) + accruedInterest;

  async function handleBorrow() {
    if (!selectedMarket || !borrowAmount) {
      toast.error("Please fill all fields");
      return;
    }
    if (!isMarketBorrower) {
      toast.error("Only the market borrower can borrow");
      return;
    }
    if (!selectedMarketData) {
      toast.error("Market not found");
      return;
    }

    // Block a second borrow when debt already exists in this market.
    // The contract creates new positions; it cannot top-up an existing loan.
    if (totalDebt && totalDebt > BigInt(0)) {
      toast.error("You already have active debt in this market. Repay it first or create a new market.");
      return;
    }

    if (!marketCollateral || marketCollateral === BigInt(0)) {
      toast.error("Please deposit collateral first before borrowing");
      return;
    }

    const borrowAmountNum = parseFloat(borrowAmount);
    const maxBorrowNum = parseFloat(maxBorrowFormatted);

    if (borrowAmountNum > maxBorrowNum) {
      toast.error(`Cannot borrow more than ${maxBorrowFormatted} ${selectedMarketData.borrow_asset.symbol}. Deposit more collateral.`);
      return;
    }

    await borrowMutation.mutateAsync({
      market_address: selectedMarket,
      borrow_amount: borrowAmount,
      borrow_asset_decimals: selectedMarketData.borrow_asset.decimals,
      use_senior_only: useSeniorOnly,
      max_apr: parseInt(maxAPR),
    });
  }

  async function handleRepay() {
    if (!selectedMarket || !repayAmount) {
      toast.error("Please fill all fields");
      return;
    }
    if (!isMarketBorrower) {
      toast.error("Only the market borrower can repay");
      return;
    }
    if (!selectedMarketData) {
      toast.error("Market not found");
      return;
    }
    await repayMutation.mutateAsync({
      market_address: selectedMarket,
      amount: repayAmount,
      borrow_asset_address: selectedMarketData.borrow_asset.address,
      borrow_asset_decimals: selectedMarketData.borrow_asset.decimals,
    });
  }

  async function handleDeposit() {
    if (!selectedMarket || !depositAmount) {
      toast.error("Please select a market and enter an amount");
      return;
    }
    if (!isMarketBorrower) {
      toast.error("Only the market borrower can deposit collateral");
      return;
    }
    if (!selectedMarketData) {
      toast.error("Market not found");
      return;
    }
    await depositMutation.mutateAsync({
      marketAddress: selectedMarket,
      collateralAssetAddress: selectedMarketData.collateral_asset.address,
      collateralAssetDecimals: selectedMarketData.collateral_asset.decimals,
      amount: depositAmount,
    });
    setDepositAmount("");
  }

  async function handleWithdraw() {
    if (!selectedMarket || !withdrawAmount) {
      toast.error("Please select a market and enter an amount");
      return;
    }
    if (!isMarketBorrower) {
      toast.error("Only the market borrower can withdraw collateral");
      return;
    }
    if (!selectedMarketData) {
      toast.error("Market not found");
      return;
    }
    await withdrawMutation.mutateAsync({
      marketAddress: selectedMarket,
      collateralAssetDecimals: selectedMarketData.collateral_asset.decimals,
      amount: withdrawAmount,
    });
    setWithdrawAmount("");
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
          Institutional Borrowing
        </p>
        <h1 className="text-2xl font-semibold text-on-surface">Borrower Portal</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Access fixed-rate credit with enterprise-grade risk parameters
        </p>
      </div>

      {/* Not registered */}
      {address && !borrowerLoading && !borrower && (
        <Card className="p-5 border-amber-400/20 bg-amber-400/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">Not registered as borrower</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Register to access borrowing features</p>
            </div>
            <Button
              size="sm"
              onClick={() => address && registerMutation.mutate({ borrower: address as `0x${string}` })}
              loading={registerMutation.isPending}
            >
              Register Now
            </Button>
          </div>
        </Card>
      )}

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {borrowerLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Total Borrowed</p>
              <p className="text-xl font-semibold text-on-surface mono">{fmtUSD(borrower?.total_borrowed)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Outstanding Debt</p>
              <p className="text-xl font-semibold text-on-surface mono">
                {fmtUSD(
                  String(
                    Math.max(0, parseFloat(borrower?.total_borrowed ?? "0") - parseFloat(borrower?.total_repaid ?? "0"))
                  )
                )}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Active Loans</p>
              <p className="text-xl font-semibold text-on-surface mono">{borrower?.active_loans ?? 0}</p>
            </Card>
            {/* Health Factor — ring replaces flat progress bar */}
            <Card className="p-4 flex flex-col items-center justify-center gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant self-stretch">Health Factor</p>
              <HealthFactorRing value={healthFactor} size="sm" />
            </Card>
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Reputation</p>
              <p className="text-xl font-semibold text-primary mono">{borrower?.reputation_score ?? "—"}</p>
              <RiskBadge label={borrower?.risk_label ?? "N/A"} />
            </Card>
          </>
        )}
      </div>

      {/* Market selector - ONLY shows markets where user is borrower */}
      <Card className="p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-2">
          Your Market
        </label>
        <MarketSelector
          value={selectedMarket}
          onValueChange={setSelectedMarket}
          showBadge={true}
          filterByBorrower={true}
        />
      </Card>

      {/* Access Control Warning */}
      {selectedMarket && !isMarketBorrower && (
        <Card className="p-5 border-red-400/20 bg-red-400/5">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">Access Denied</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Only the market borrower can deposit collateral, borrow, or repay in this market.
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Market borrower: <span className="font-mono text-on-surface">{formatAddress(selectedMarketData?.borrower || "")}</span>
              </p>
              <p className="text-xs text-on-surface-variant">
                Your address: <span className="font-mono text-on-surface">{formatAddress(address || "")}</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* AVAILABLE LIQUIDITY OVERVIEW */}
      {selectedMarket && isMarketBorrower && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liquidity Stats */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Available Liquidity for Your Market
                </h3>
              </div>

              {offersLoading ? (
                <Skeleton className="h-32" />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded bg-primary/5 border border-primary/20">
                      <p className="text-xs text-on-surface-variant mb-1">Senior Liquidity</p>
                      <p className="text-2xl font-bold text-primary">
                        {(seniorLiquidity / 1e6).toFixed(2)}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {selectedMarketData?.borrow_asset.symbol} · {seniorOfferCount} offers
                      </p>
                    </div>
                    <div className="p-3 rounded bg-surface-container border border-outline-variant/20">
                      <p className="text-xs text-on-surface-variant mb-1">Junior Liquidity</p>
                      <p className="text-2xl font-bold text-on-surface">
                        {(juniorLiquidity / 1e6).toFixed(2)}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {selectedMarketData?.borrow_asset.symbol} · {juniorOfferCount} offers
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-on-surface-variant">Total Available</span>
                      <span className="text-lg font-bold text-on-surface">
                        {totalLiquidity ? formatUnits(totalLiquidity, selectedMarketData?.borrow_asset.decimals || 6) : '0'} {selectedMarketData?.borrow_asset.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-on-surface-variant">Best Available APR</span>
                      <span className="text-lg font-bold text-primary">
                        {formatAPR(bestAPR)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-on-surface-variant">Active Offers</span>
                      <span className="text-lg font-bold text-on-surface">
                        {offerCount?.toString() || marketOffers?.count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Borrow Preview */}
            <Card className="p-5 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Borrow Preview
                </h3>
              </div>

              {!borrowAmount || parseFloat(borrowAmount) <= 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-on-surface-variant">
                    Enter a borrow amount below to see which offers will be matched
                  </p>
                </div>
              ) : previewLoading ? (
                <Skeleton className="h-32" />
              ) : borrowPreview ? (
                <div className="space-y-3">
                  <p className="text-xs text-on-surface-variant">
                    For amount: <span className="font-semibold text-primary">{borrowAmount} {selectedMarketData?.borrow_asset.symbol}</span>
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-on-surface-variant">Offers to match:</span>
                      <span className="font-semibold text-on-surface">{borrowPreview.offers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-on-surface-variant">Total available:</span>
                      <span className="font-semibold text-on-surface">
                        {formatUnits(borrowPreview.totalAvailable, selectedMarketData?.borrow_asset.decimals || 6)} {selectedMarketData?.borrow_asset.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-on-surface-variant">Your weighted APR:</span>
                      <span className="text-lg font-bold text-primary">{formatAPR(Number(borrowPreview.weightedApr))}</span>
                    </div>
                  </div>

                  {borrowPreview.offers.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-primary/20">
                      <p className="text-xs font-semibold text-on-surface-variant mb-2">Offers that will be filled:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {borrowPreview.offers.slice(0, 5).map((offer: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs py-1">
                            <span className="text-on-surface-variant">Offer #{offer.id?.toString() || idx + 1}</span>
                            <span className="text-on-surface">
                              {formatUnits(offer.remainingAmount || offer.amount, selectedMarketData?.borrow_asset.decimals || 6)} @ {formatAPR(Number(offer.apr))}
                            </span>
                          </div>
                        ))}
                        {borrowPreview.offers.length > 5 && (
                          <p className="text-xs text-on-surface-variant italic">+ {borrowPreview.offers.length - 5} more offers...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {borrowPreview.totalAvailable < BigInt(parseFloat(borrowAmount) * 1e6) && (
                    <div className="mt-3 p-3 bg-amber-400/10 border border-amber-400/30 rounded">
                      <p className="text-xs text-amber-400 font-semibold">
                        ⚠️ Insufficient liquidity! Only {formatUnits(borrowPreview.totalAvailable, selectedMarketData?.borrow_asset.decimals || 6)} {selectedMarketData?.borrow_asset.symbol} available.
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Reduce amount or wait for more offers.
                      </p>
                    </div>
                  )}

                  {borrowPreview.weightedApr > BigInt(maxAPR) && (
                    <div className="mt-3 p-3 bg-red-400/10 border border-red-400/30 rounded">
                      <p className="text-xs text-red-400 font-semibold">
                        ❌ Weighted APR ({formatAPR(Number(borrowPreview.weightedApr))}) exceeds your max APR ({formatAPR(parseInt(maxAPR))})!
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Increase max APR or reduce borrow amount.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-red-400">No offers available for this amount</p>
                </div>
              )}
            </Card>
          </div>

          {/* OFFERS TABLE */}
          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                    Available Offers ({marketOffers?.count || 0})
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Lenders providing liquidity for your market
                  </p>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer ID</TableHead>
                  <TableHead>Lender</TableHead>
                  <TableHead className="text-right">Amount Available</TableHead>
                  <TableHead className="text-right">APR</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : marketOffers?.offers && marketOffers.offers.length > 0 ? (
                  marketOffers.offers.map((offer) => (
                    <TableRow key={offer.offer_id}>
                      <TableCell className="font-mono">#{offer.offer_id}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{formatAddress(offer.lender)}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(parseFloat(offer.remaining_amount || offer.amount) / 1e6).toFixed(2)} {selectedMarketData?.borrow_asset.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-primary font-semibold">{formatAPR(offer.apr)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${offer.seniority === 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface'}`}>
                          {offer.seniority === 0 ? 'Senior' : 'Junior'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant">
                        {formatTimestamp(offer.expiry)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No offers available"
                        description="No lenders have submitted offers for this market yet. Contact lenders or wait for offers."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collateral */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Collateral</p>
          </div>

          {/* Display MARKET-SPECIFIC collateral balance */}
          {marketCollateral && marketCollateral > BigInt(0) && (
            <div className="p-3 rounded bg-emerald-400/10 border border-emerald-400/30">
              <p className="text-xs text-emerald-400 mb-1 font-semibold">✓ Your Collateral in This Market</p>
              <p className="text-2xl font-bold text-emerald-400">
                {parseFloat(collateralFormatted).toFixed(4)} {selectedMarketData?.collateral_asset.symbol || "WETH"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                ≈ ${(parseFloat(collateralFormatted) * 2000).toFixed(2)} USD
              </p>
            </div>
          )}

          {/* Show message if no collateral */}
          {selectedMarket && (!marketCollateral || marketCollateral === BigInt(0)) && (
            <div className="p-3 rounded bg-yellow-400/10 border border-yellow-400/30">
              <p className="text-xs text-yellow-400 font-semibold">⚠️ No Collateral Deposited</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Deposit collateral below before borrowing
              </p>
            </div>
          )}

          <Input
            label={`Deposit ${selectedMarketData?.collateral_asset.symbol ?? "Collateral"}`}
            type="number"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            suffix={selectedMarketData?.collateral_asset.symbol ?? ""}
          />
          <Button
            className="w-full"
            onClick={handleDeposit}
            loading={depositMutation.isPending}
            disabled={!address || !borrower || !selectedMarket || !isMarketBorrower}
          >
            {!isMarketBorrower && selectedMarket ? "Not Authorized" : "Deposit Collateral"}
          </Button>

          <div className="border-t border-outline-variant/10 pt-4">
            <Input
              label={`Withdraw ${selectedMarketData?.collateral_asset.symbol ?? "Collateral"}`}
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              suffix={selectedMarketData?.collateral_asset.symbol ?? ""}
            />
            <Button
              variant="secondary"
              className="w-full mt-3"
              onClick={handleWithdraw}
              loading={withdrawMutation.isPending}
              disabled={!address || !borrower || !selectedMarket || !isMarketBorrower}
            >
              {!isMarketBorrower && selectedMarket ? "Not Authorized" : "Withdraw Collateral"}
            </Button>
          </div>
        </Card>

        {/* Borrow */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Borrow</p>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>

          {/* Existing-debt warning */}
          {totalDebt && totalDebt > BigInt(0) && (
            <div className="p-3 rounded bg-red-400/10 border border-red-400/30">
              <p className="text-xs text-red-400 font-semibold">
                ⚠️ Active loan detected
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                You already have {formatUnits(totalDebt, selectedMarketData?.borrow_asset.decimals || 6)}{" "}
                {selectedMarketData?.borrow_asset.symbol ?? "USDC"} outstanding in this market.
                Repay your existing debt first, or create a new market to borrow more.
              </p>
            </div>
          )}

          {/* MAX BORROW AMOUNT */}
          {selectedMarket && marketCollateral && marketCollateral > BigInt(0) && (
            <div className="p-3 rounded bg-primary/10 border border-primary/30">
              <p className="text-xs text-primary mb-1 font-semibold">💰 Max You Can Borrow</p>
              <p className="text-2xl font-bold text-primary">
                {parseFloat(maxBorrowFormatted).toFixed(2)} {selectedMarketData?.borrow_asset.symbol || "USDC"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Based on your {collateralFormatted} {selectedMarketData?.collateral_asset.symbol} collateral
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-on-surface">
                Amount ({selectedMarketData?.borrow_asset.symbol ?? "USDC"})
              </label>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => {
                  const maxLiq = totalLiquidity ? formatUnits(totalLiquidity, selectedMarketData?.borrow_asset.decimals || 6) : maxBorrowFormatted;
                  setBorrowAmount(maxLiq);
                }}
              >
                MAX
              </Button>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              suffix={selectedMarketData?.borrow_asset.symbol ?? "USDC"}
              hint={`Max available: ${totalLiquidity ? formatUnits(totalLiquidity, selectedMarketData?.borrow_asset.decimals || 6) : '0'} ${selectedMarketData?.borrow_asset.symbol ?? "USDC"}`}
            />
          </div>

          {/* Senior Only Toggle */}
          <div className="flex items-center gap-3 p-3 rounded bg-surface-container-low">
            <input
              type="checkbox"
              id="seniorOnly"
              checked={useSeniorOnly}
              onChange={(e) => setUseSeniorOnly(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant"
            />
            <label htmlFor="seniorOnly" className="text-sm text-on-surface cursor-pointer">
              Use Senior Offers Only
              <span className="block text-xs text-on-surface-variant mt-0.5">
                Senior offers have priority in liquidation but may have higher APR
              </span>
            </label>
          </div>

          <Input
            label="Max APR (BPS)"
            type="number"
            placeholder="1000"
            value={maxAPR}
            onChange={(e) => setMaxAPR(e.target.value)}
            hint={`= ${(parseInt(maxAPR || "0") / 100).toFixed(2)}% ${borrowPreview ? `(Actual: ${formatAPR(Number(borrowPreview.weightedApr))})` : ''}`}
          />
          <div className="rounded-lg bg-surface-container-low p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Health Factor</span>
              <span className={hfColor}>{healthFactor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Market APR</span>
              <span className="text-primary">{formatAPR(selectedMarketData?.weighted_apr ?? 0)}</span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleBorrow}
            loading={borrowMutation.isPending}
            disabled={
              !address ||
              !borrower ||
              !selectedMarket ||
              !isMarketBorrower ||
              !borrowAmount ||
              !!(totalDebt && totalDebt > BigInt(0)) ||
              (borrowPreview && borrowPreview.totalAvailable < BigInt(parseFloat(borrowAmount) * Math.pow(10, selectedMarketData?.borrow_asset.decimals || 6))) ||
              (borrowPreview && borrowPreview.weightedApr > BigInt(maxAPR))
            }
          >
            {!isMarketBorrower && selectedMarket
              ? "Not Authorized"
              : totalDebt && totalDebt > BigInt(0)
              ? "Repay Existing Debt First"
              : borrowPreview && borrowPreview.totalAvailable < BigInt(parseFloat(borrowAmount || "0") * Math.pow(10, selectedMarketData?.borrow_asset.decimals || 6))
              ? "Insufficient Liquidity"
              : borrowPreview && borrowPreview.weightedApr > BigInt(maxAPR)
              ? "APR Exceeds Max"
              : "Execute Borrow"}
          </Button>
        </Card>

        {/* Repay */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Repay</p>
            <RefreshCw className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="rounded-lg bg-surface-container-low p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded bg-primary-container/10 flex items-center justify-center text-xs font-bold text-primary">$</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Debt Breakdown</p>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Principal</span>
              <span className="text-on-surface font-mono">
                ${((parseFloat(borrower?.total_borrowed ?? "0") - parseFloat(borrower?.total_repaid ?? "0")) / 1e6).toFixed(2)}M
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Accrued Interest</span>
              <span className="text-amber-400 font-mono">
                +${(accruedInterest / 1e6).toFixed(4)}M
              </span>
            </div>

            <div className="border-t border-outline-variant/20 pt-2 flex justify-between items-center">
              <span className="text-xs font-semibold text-on-surface-variant">Total Owed</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface font-mono">
                  ${(totalDebtWithInterest / 1e6).toFixed(4)}M
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setRepayAmount(totalDebtWithInterest.toString())}
                >
                  Full Amount
                </Button>
              </div>
            </div>
          </div>
          <Input
            label={`Repay Amount (${selectedMarketData?.borrow_asset.symbol ?? "USDC"})`}
            type="number"
            placeholder="0.00"
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
            suffix={selectedMarketData?.borrow_asset.symbol ?? "USDC"}
            hint={`Enter amount to repay (min: cover interest of ${(accruedInterest / 1e6).toFixed(4)}M). Partial payments allowed.`}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              size="lg"
              onClick={handleRepay}
              loading={repayMutation.isPending}
              disabled={!address || !repayAmount || !selectedMarket || !isMarketBorrower}
            >
              Repay Partial
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              size="lg"
              onClick={async () => {
                if (!selectedMarket || !selectedMarketData) {
                  toast.error("Please select a market first");
                  return;
                }
                await repayFullMutation.mutateAsync({
                  marketAddress: selectedMarket,
                  borrowAssetAddress: selectedMarketData.borrow_asset.address,
                });
              }}
              loading={repayFullMutation.isPending}
              disabled={!address || !selectedMarket || !isMarketBorrower}
            >
              Repay Full
            </Button>
          </div>
        </Card>

        {/* Market Health Status */}
        {selectedMarket && isMarketBorrower && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Market Health</p>
              {marketHealth.isHealthy ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Collateral Ratio</span>
                <span className="font-mono text-on-surface">
                  {marketHealth.collateralRatio ?
                    `${(Number(marketHealth.collateralRatio) / 100).toFixed(2)}%` :
                    '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total Owed (On-Chain)</span>
                <span className="font-mono text-on-surface">
                  {marketHealth.totalOwed ?
                    `${formatUnits(marketHealth.totalOwed, selectedMarketData?.borrow_asset.decimals || 6)} ${selectedMarketData?.borrow_asset.symbol}` :
                    '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Liquidatable</span>
                <span className={marketHealth.isLiquidatable ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                  {marketHealth.isLiquidatable ? 'Yes - At Risk!' : 'No'}
                </span>
              </div>
            </div>

            {/* Close Market Button - only shows when debt is 0 */}
            {marketHealth.totalOwed === BigInt(0) && (
              <div className="pt-4 border-t border-outline-variant/20">
                <p className="text-xs text-on-surface-variant mb-2">
                  ✅ All debt repaid. You can now close this market.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await closeMarketMutation.mutateAsync({ marketAddress: selectedMarket });
                  }}
                  loading={closeMarketMutation.isPending}
                >
                  Close Market Permanently
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Active Positions */}
      <Card>
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Active Positions</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Your active lending positions across markets</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead>Market</TableHead>
              <TableHead className="text-right">APR</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions?.positions.length ? (
              positions.positions.map((pos) => (
                <TableRow key={pos.token_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary-container/15 flex items-center justify-center text-xs font-bold text-primary">
                        #{pos.token_id}
                      </div>
                      <span className="text-sm font-medium">Token {pos.token_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right mono">${(parseFloat(pos.principal) / 1e6).toFixed(4)}M</TableCell>
                  <TableCell className="text-sm text-on-surface-variant mono">{formatAddress(pos.market_address, 4)}</TableCell>
                  <TableCell className="text-right"><span className="text-primary font-bold">{formatAPR(pos.apr)}</span></TableCell>
                  <TableCell><StatusBadge status={pos.status} /></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="No active positions" description="Deposit collateral and execute a borrow to get started" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function BorrowPage() {
  return (
    <Suspense>
      <BorrowContent />
    </Suspense>
  );
}
