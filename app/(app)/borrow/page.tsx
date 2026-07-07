"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { WalletPrompt } from "@/components/wallet-gate";
import {
  useBorrower,
  useBorrowerRisk,
  useBorrow,
  useRepay,
  useDepositCollateral,
  useWithdrawCollateral,
} from "@/hooks/useBorrower";
import { useArchControllerOwner } from "@/hooks/useArchController";
import { useRepayFull, useCloseMarket } from "@/hooks/useMarketActions";
import { useMarketHealth, useMaxBorrowable } from "@/hooks/useMarketMetrics";
import { useMarkets } from "@/hooks/useMarkets";
import { useMarketOffers } from "@/hooks/useOffers";
import { useBestOffers, useTotalLiquidityAvailable, useActiveOfferCount } from "@/hooks/useOfferBookMetrics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR, formatTimestamp, fmtUSD, formatTokenAmount } from "@/lib/utils";
import { HealthFactorRing } from "@/components/HealthFactorRing";
import { AlertTriangle, RefreshCw, ShieldCheck, Lock, TrendingUp, CheckCircle2, XCircle, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { MarketSelector } from "@/components/MarketSelector";
import { useMarketCollateralBalance, useMinCollateralRatio, useMarketTotalDebt, useMarketCurrentPrincipal, useCollateralOracleConverter } from "@/hooks/useMarketCollateral";
import { formatUnits, parseUnits } from "viem";
import { useMyBorrowerRequest, useRequestBorrowerAccess } from "@/hooks/useBorrowerRequests";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";

function BorrowContent() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const { data: borrower, isLoading: borrowerLoading } = useBorrower(address ?? "");
  const { data: risk } = useBorrowerRisk(address ?? "");
  const { data: markets } = useMarkets({ is_active: true });
  const { data: archControllerOwner } = useArchControllerOwner();
  const { isAuthenticated } = useAuthStore();
  const { login, isSigningIn } = useSIWE();
  const { data: myRequest } = useMyBorrowerRequest();
  const requestAccessMutation = useRequestBorrowerAccess();
  const borrowMutation = useBorrow();
  const repayMutation = useRepay();
  const repayFullMutation = useRepayFull();
  const closeMarketMutation = useCloseMarket();
  const depositMutation = useDepositCollateral();
  const withdrawMutation = useWithdrawCollateral();

  const [selectedMarket, setSelectedMarket] = useState("");

  useEffect(() => {
    const marketParam = searchParams.get("market");
    if (marketParam) setSelectedMarket(marketParam);
  }, [searchParams]);
  const [useSeniorOnly, setUseSeniorOnly] = useState(false);

  const marketHealth = useMarketHealth(selectedMarket as `0x${string}`);

  const { data: marketCollateral } = useMarketCollateralBalance(
    selectedMarket as `0x${string}`,
    address as `0x${string}`
  );

  const { data: minCollateralRatio } = useMinCollateralRatio(selectedMarket as `0x${string}`);
  const { data: totalDebt } = useMarketTotalDebt(selectedMarket as `0x${string}`);
  const { data: currentPrincipal } = useMarketCurrentPrincipal(selectedMarket as `0x${string}`);
  const { toBorrowUnits: collateralToBorrowUnits, ready: oracleReady } = useCollateralOracleConverter(selectedMarket as `0x${string}`);

  const [borrowAmount, setBorrowAmount] = useState("");
  const [maxAPR, setMaxAPR] = useState("1000");
  const [repayAmount, setRepayAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [simCollateral, setSimCollateral] = useState(0);
  const [simBorrow, setSimBorrow] = useState(0);

  // Zero debt: getCollateralRatio() returns a sentinel near type(uint256).max, so
  // treat "no debt" as its own healthy state rather than dividing it out.
  const hasNoDebt = marketHealth.totalOwed !== undefined && marketHealth.totalOwed === BigInt(0);

  const onChainHealthFactor =
    !hasNoDebt && marketHealth.collateralRatio && minCollateralRatio && Number(minCollateralRatio) > 0
      ? Number(marketHealth.collateralRatio) / Number(minCollateralRatio)
      : null;
  const healthFactorUnknown = !hasNoDebt && onChainHealthFactor === null && marketHealth.isError;
  const healthFactor = onChainHealthFactor ?? (healthFactorUnknown ? 0 : (risk?.health_factor ?? 0));
  const hfColor = healthFactorUnknown ? "text-on-surface-variant" : hasNoDebt ? "text-emerald-400" : healthFactor > 1.5 ? "text-emerald-400" : healthFactor > 1.2 ? "text-amber-400" : "text-red-400";

  const selectedMarketData = markets?.markets.find((m) => m.address === selectedMarket);

  const isMarketBorrower = address && selectedMarketData &&
    address.toLowerCase() === selectedMarketData.borrower.toLowerCase();

  const { data: marketOffers, isLoading: offersLoading } = useMarketOffers(selectedMarket);

  const { data: totalLiquidity } = useTotalLiquidityAvailable(selectedMarket as `0x${string}`);
  const { data: offerCount } = useActiveOfferCount(selectedMarket as `0x${string}`);

  const { data: borrowPreview } = useBestOffers(
    selectedMarket as `0x${string}`,
    borrowAmount,
    selectedMarketData?.borrow_asset.decimals || 6,
    useSeniorOnly
  );

  const { data: maxBorrowWeiRaw } = useMaxBorrowable(selectedMarket as `0x${string}`);
  const maxBorrowWei = maxBorrowWeiRaw ?? BigInt(0);

  const maxBorrowFormatted = formatUnits(maxBorrowWei, selectedMarketData?.borrow_asset.decimals || 6);
  const collateralFormatted = marketCollateral
    ? formatUnits(marketCollateral, selectedMarketData?.collateral_asset.decimals || 18)
    : "0";

  const { seniorLiquidity, juniorLiquidity, seniorOfferCount, juniorOfferCount, bestAPR } = useMemo(() => {
    const offers = marketOffers?.offers ?? [];
    const decimals = selectedMarketData?.borrow_asset.decimals ?? 6;
    const senior = offers.filter(o => o.seniority === 0);
    const junior = offers.filter(o => o.seniority === 1);
    const sumAmounts = (list: typeof offers) =>
      list.reduce((sum, o) => sum + Number(formatUnits(BigInt(o.remaining_amount || o.amount || "0"), decimals)), 0);
    return {
      seniorLiquidity: sumAmounts(senior),
      juniorLiquidity: sumAmounts(junior),
      seniorOfferCount: senior.length,
      juniorOfferCount: junior.length,
      bestAPR: offers.length > 0 ? Math.min(...offers.map(o => o.apr)) : 0,
    };
  }, [marketOffers, selectedMarketData?.borrow_asset.decimals]);

  useEffect(() => {
    setSimCollateral(parseFloat(depositAmount || "0") || 0);
    setSimBorrow(parseFloat(borrowAmount || "0") || 0);
  }, [depositAmount, borrowAmount]);

  const collateralDecimalsForSim = selectedMarketData?.collateral_asset.decimals ?? 18;
  const borrowDecimalsForSim = selectedMarketData?.borrow_asset.decimals ?? 6;
  const simCollateralValueInBorrowUnits =
    oracleReady && collateralToBorrowUnits && simCollateral > 0
      ? Number(formatUnits(collateralToBorrowUnits(parseUnits(simCollateral.toString(), collateralDecimalsForSim)), borrowDecimalsForSim))
      : 0;
  const simMinRatio = minCollateralRatio ? Number(minCollateralRatio) / 10000 : 1.1;
  const simMaxBorrow = simMinRatio > 0 ? simCollateralValueInBorrowUnits / simMinRatio : 0;
  const simHealthFactor = simBorrow > 0 ? simCollateralValueInBorrowUnits / (simBorrow * simMinRatio) : 0;
  const simLiquidationPrice = simCollateral > 0 && simBorrow > 0 ? (simBorrow * simMinRatio) / simCollateral : 0;
  const simBorrowPower = simMaxBorrow > 0 ? Math.min((simBorrow / simMaxBorrow) * 100, 100) : 0;
  const simHealthColor = simHealthFactor >= 1.5 ? "text-emerald-400" : simHealthFactor >= 1.2 ? "text-amber-400" : "text-red-400";

  // Total Owed and Principal both come from this market's own on-chain state
  // (totalDebt/getCurrentPrincipal), so Interest is just their difference.
  const repayDecimals = selectedMarketData?.borrow_asset.decimals ?? 6;
  const totalDebtDecimal = totalDebt !== undefined ? parseFloat(formatUnits(totalDebt, repayDecimals)) : 0;
  const principalDecimal = currentPrincipal !== undefined ? parseFloat(formatUnits(currentPrincipal, repayDecimals)) : 0;
  const accruedInterestDecimal = Math.max(0, totalDebtDecimal - principalDecimal);

  const maxAPRBigInt = BigInt(Number.isFinite(parseInt(maxAPR)) ? parseInt(maxAPR) : 0);
  let requiredBorrowWei = BigInt(0);
  try {
    requiredBorrowWei = borrowAmount ? parseUnits(borrowAmount, borrowDecimalsForSim) : BigInt(0);
  } catch {
    requiredBorrowWei = BigInt(0);
  }

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

  if (!address) {
    return (
      <WalletPrompt
        title="Connect your wallet"
        description="Connect your wallet to access the borrow portal, deposit collateral, and manage your loans."
      />
    );
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">Not registered as borrower</p>
              {!isAuthenticated ? (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Sign in with your wallet to request borrower access.
                </p>
              ) : myRequest?.status === "pending" ? (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Your borrower access request is pending admin review.
                </p>
              ) : myRequest?.status === "rejected" ? (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Your borrower access request was declined
                  {myRequest.note ? ` (${myRequest.note})` : ""}. You can request again below.
                </p>
              ) : (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Request access below — the protocol admin
                  {archControllerOwner ? ` (${formatAddress(archControllerOwner as string)})` : ""} reviews and
                  approves new borrowers on-chain.
                </p>
              )}
            </div>
            {!isAuthenticated ? (
              <Button size="sm" onClick={() => login()} loading={isSigningIn}>
                Sign In
              </Button>
            ) : myRequest?.status === "pending" ? (
              <StatusBadge status="pending" />
            ) : (
              <Button
                size="sm"
                onClick={() => requestAccessMutation.mutate()}
                loading={requestAccessMutation.isPending}
              >
                {myRequest?.status === "rejected" ? "Request Again" : "Request Borrower Access"}
              </Button>
            )}
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Total Borrowed (Lifetime)</p>
              <p className="text-xl font-semibold text-on-surface mono">{fmtUSD(borrower?.total_borrowed)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Outstanding Debt</p>
              <p className="text-xl font-semibold text-on-surface mono">
                {/* Prefer the live on-chain balance for the selected market - the
                    backend's total_borrowed/total_repaid only update on a full
                    repay cycle, so during partial repayment they'd stay frozen
                    at the original amount even as the real debt goes down. */}
                {totalDebt !== undefined && selectedMarketData
                  ? fmtUSD(totalDebt.toString(), selectedMarketData.borrow_asset.decimals)
                  : fmtUSD(
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
              <HealthFactorRing value={healthFactor} error={healthFactorUnknown} size="sm" />
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
                        {seniorLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {selectedMarketData?.borrow_asset.symbol} · {seniorOfferCount} offers
                      </p>
                    </div>
                    <div className="p-3 rounded bg-surface-container border border-outline-variant/20">
                      <p className="text-xs text-on-surface-variant mb-1">Junior Liquidity</p>
                      <p className="text-2xl font-bold text-on-surface">
                        {juniorLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        {formatTokenAmount(offer.remaining_amount || offer.amount, selectedMarketData?.borrow_asset.decimals)} {selectedMarketData?.borrow_asset.symbol}
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
            min="0"
            step="1"
            placeholder="1000"
            value={maxAPR}
            onChange={(e) => {
              const v = e.target.value;
              // BPS is a whole number (1250 = 12.50%) - reject decimal input
              if (v === "" || /^\d+$/.test(v)) setMaxAPR(v);
            }}
            hint={`= ${(parseInt(maxAPR || "0") / 100).toFixed(2)}% ${borrowPreview ? `(Actual: ${formatAPR(Number(borrowPreview.weightedApr))})` : ''}`}
          />
          <div className="rounded-lg bg-surface-container-low p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Health Factor</span>
              <span className={hfColor}>{hasNoDebt ? "∞ (no debt)" : healthFactorUnknown ? "Unable to verify" : healthFactor.toFixed(2)}</span>
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
              (borrowPreview && borrowPreview.totalAvailable < requiredBorrowWei) ||
              (borrowPreview && borrowPreview.weightedApr > maxAPRBigInt)
            }
          >
            {!isMarketBorrower && selectedMarket
              ? "Not Authorized"
              : totalDebt && totalDebt > BigInt(0)
              ? "Repay Existing Debt First"
              : borrowPreview && borrowPreview.totalAvailable < requiredBorrowWei
              ? "Insufficient Liquidity"
              : borrowPreview && borrowPreview.weightedApr > maxAPRBigInt
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
                {principalDecimal.toFixed(2)} {selectedMarketData?.borrow_asset.symbol}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Accrued Interest</span>
              <span className="text-amber-400 font-mono">
                +{accruedInterestDecimal.toFixed(4)} {selectedMarketData?.borrow_asset.symbol}
              </span>
            </div>

            <div className="border-t border-outline-variant/20 pt-2 flex justify-between items-center">
              <span className="text-xs font-semibold text-on-surface-variant">Total Owed</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface font-mono">
                  {totalDebtDecimal.toFixed(4)} {selectedMarketData?.borrow_asset.symbol}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setRepayAmount(totalDebtDecimal.toString())}
                >
                  Full Amount
                </Button>
              </div>
            </div>
          </div>
          <Input
            label={`Repay Amount (${selectedMarketData?.borrow_asset.symbol ?? "USDC"})`}
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={repayAmount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || parseFloat(v) >= 0) setRepayAmount(v);
            }}
            suffix={selectedMarketData?.borrow_asset.symbol ?? "USDC"}
            hint={`Enter amount to repay (min: cover interest of ${accruedInterestDecimal.toFixed(4)} ${selectedMarketData?.borrow_asset.symbol ?? ""}). Partial payments allowed.`}
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
              {marketHealth.isError ? (
                <AlertTriangle className="h-4 w-4 text-on-surface-variant" />
              ) : marketHealth.isHealthy ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Collateral Ratio</span>
                <span className="font-mono text-on-surface">
                  {hasNoDebt
                    ? "∞ (no debt)"
                    : marketHealth.collateralRatio !== undefined
                      ? `${(Number(marketHealth.collateralRatio) / 100).toFixed(2)}%`
                      : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total Owed (On-Chain)</span>
                <span className="font-mono text-on-surface">
                  {marketHealth.totalOwed !== undefined ?
                    `${formatUnits(marketHealth.totalOwed, selectedMarketData?.borrow_asset.decimals || 6)} ${selectedMarketData?.borrow_asset.symbol}` :
                    '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Liquidatable</span>
                <span className={marketHealth.isError ? 'text-on-surface-variant' : marketHealth.isLiquidatable ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                  {marketHealth.isError ? 'Unable to verify' : marketHealth.isLiquidatable ? 'Yes - At Risk!' : 'No'}
                </span>
              </div>
            </div>

            {/* Close Market Button - only shows when debt is 0 */}
            {marketHealth.totalOwed === BigInt(0) && (
              <div className="pt-4 border-t border-outline-variant/20">
                <p className="text-xs text-on-surface-variant mb-2">
                  ✅ No outstanding debt on this market. You can close it if you no longer plan to borrow here.
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

      {/* Live Simulation Panel — only show when market is selected and user has entered values */}
      {selectedMarket && (simCollateral > 0 || simBorrow > 0) && (
        <Card className="p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Live Simulation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-xs text-on-surface-variant mb-1">Health Factor</p>
              <p className={`text-lg font-bold mono ${simHealthColor}`}>
                {simBorrow > 0 ? simHealthFactor.toFixed(2) : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-xs text-on-surface-variant mb-1">Liquidation Price</p>
              <p className="text-lg font-bold mono text-on-surface">
                {simLiquidationPrice > 0 ? `${simLiquidationPrice.toFixed(4)} ${selectedMarketData?.borrow_asset.symbol ?? ""}` : "—"}
              </p>
              <p className="text-[10px] text-on-surface-variant">per {selectedMarketData?.collateral_asset.symbol ?? "unit"}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-xs text-on-surface-variant mb-1">Borrow Power Used</p>
              <p className="text-lg font-bold mono text-on-surface">
                {simBorrow > 0 ? `${simBorrowPower.toFixed(0)}%` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-xs text-on-surface-variant mb-1">Max Borrowable</p>
              <p className="text-lg font-bold mono text-on-surface">
                {simMaxBorrow > 0
                  ? `${simMaxBorrow >= 1000 ? `${(simMaxBorrow / 1000).toFixed(1)}K` : simMaxBorrow.toFixed(2)} ${selectedMarketData?.borrow_asset.symbol ?? ""}`
                  : "—"}
              </p>
            </div>
          </div>
          {simBorrow > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Borrow Power</span>
                <span className={simHealthColor}>{simBorrowPower.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-container-low overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    simBorrowPower < 60 ? "bg-emerald-400" : simBorrowPower < 80 ? "bg-amber-400" : "bg-red-400"
                  }`}
                  style={{ width: `${simBorrowPower}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

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
