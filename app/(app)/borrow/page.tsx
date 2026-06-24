"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  useBorrower,
  useBorrowerRisk,
  useBorrow,
  useRepay,
  useRegisterBorrower,
  useDepositCollateral,
  useWithdrawCollateral,
  useCollateralBalance,
} from "@/hooks/useBorrower";
import { usePositions } from "@/hooks/usePositions";
import { useMarkets } from "@/hooks/useMarkets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatAddress, formatAPR } from "@/lib/utils";
import { AlertTriangle, RefreshCw, ShieldCheck, Lock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MarketSelector } from "@/components/MarketSelector";
import { useMarketCollateralBalance, useMinCollateralRatio, useMarketTotalDebt, calculateMaxBorrow } from "@/hooks/useMarketCollateral";
import { formatUnits } from "viem";

export default function BorrowPage() {
  const { address } = useAccount();
  const { data: borrower, isLoading: borrowerLoading } = useBorrower(address ?? "");
  const { data: risk } = useBorrowerRisk(address ?? "");
  const { data: markets } = useMarkets({ is_active: true });
  const { data: positions } = usePositions();
  const registerMutation = useRegisterBorrower();
  const borrowMutation = useBorrow();
  const repayMutation = useRepay();
  const depositMutation = useDepositCollateral();
  const withdrawMutation = useWithdrawCollateral();

  const [selectedMarket, setSelectedMarket] = useState("");

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

  const healthFactor = risk?.health_factor ?? 0;
  const hfColor = healthFactor > 2 ? "text-emerald-400" : healthFactor > 1.3 ? "text-amber-400" : "text-red-400";

  const selectedMarketData = markets?.markets.find((m) => m.address === selectedMarket);

  // Check if connected user is the borrower of the selected market
  const isMarketBorrower = address && selectedMarketData &&
    address.toLowerCase() === selectedMarketData.borrower.toLowerCase();

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

    // NEW: Pre-flight validation
    const borrowAmountNum = parseFloat(borrowAmount);
    const maxBorrowNum = parseFloat(maxBorrowFormatted);

    if (borrowAmountNum > maxBorrowNum) {
      toast.error(`Cannot borrow more than ${maxBorrowFormatted} ${selectedMarketData.borrow_asset.symbol}. Deposit more collateral.`);
      return;
    }

    if (!marketCollateral || marketCollateral === BigInt(0)) {
      toast.error("Please deposit collateral first before borrowing");
      return;
    }

    await borrowMutation.mutateAsync({
      market_address: selectedMarket,
      borrow_amount: borrowAmount,
      borrow_asset_decimals: selectedMarketData.borrow_asset.decimals,
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
            <Button size="sm" onClick={() => registerMutation.mutate()} loading={registerMutation.isPending}>
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
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Total Borrowed</p>
              <p className="text-xl font-bold text-on-surface mt-1">
                ${(parseFloat(borrower?.total_borrowed ?? "0") / 1e6).toFixed(2)}M
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Outstanding Debt</p>
              <p className="text-xl font-bold text-on-surface mt-1">
                ${((parseFloat(borrower?.total_borrowed ?? "0") - parseFloat(borrower?.total_repaid ?? "0")) / 1e6).toFixed(2)}M
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Active Loans</p>
              <p className="text-xl font-bold text-on-surface mt-1">{borrower?.active_loans ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Health Factor</p>
              <p className={`text-xl font-bold mt-1 ${hfColor}`}>{healthFactor.toFixed(2)}</p>
              <Progress value={Math.min(100, Math.max(0, healthFactor * 50))} indicatorClassName={hfColor.replace("text-", "bg-")} className="mt-1.5" />
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Reputation</p>
              <p className="text-xl font-bold text-primary mt-1">{borrower?.reputation_score ?? "—"}</p>
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

          <Input
            label={`Amount (${selectedMarketData?.borrow_asset.symbol ?? "USDC"})`}
            type="number"
            placeholder="0.00"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            suffix={selectedMarketData?.borrow_asset.symbol ?? "USDC"}
            hint={`Max: ${maxBorrowFormatted} ${selectedMarketData?.borrow_asset.symbol ?? "USDC"}`}
          />
          <Input
            label="Max APR (BPS)"
            type="number"
            placeholder="1000"
            value={maxAPR}
            onChange={(e) => setMaxAPR(e.target.value)}
            hint={`= ${(parseInt(maxAPR || "0") / 100).toFixed(2)}%`}
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
            disabled={!address || !borrower || !selectedMarket || !isMarketBorrower}
          >
            {!isMarketBorrower && selectedMarket ? "Not Authorized" : "Execute Borrow"}
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
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={handleRepay}
            loading={repayMutation.isPending}
            disabled={!address || !repayAmount || !selectedMarket}
          >
            Repay Debt
          </Button>
        </Card>
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
