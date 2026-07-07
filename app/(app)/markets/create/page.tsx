"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { erc20Abi, isAddress, type Address } from "viem";
import { useCreateMarket } from "@/hooks/useMarkets";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { useIsRegisteredBorrower } from "@/hooks/useArchController";
import { useMyBorrowerRequest, useRequestBorrowerAccess } from "@/hooks/useBorrowerRequests";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { localChain } from "@/constants/chains";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, Rocket, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "Asset Selection" },
  { n: 2, label: "Risk Parameters" },
  { n: 3, label: "Review" },
  { n: 4, label: "Deployment" },
];

const ASSETS = [
  { symbol: "USDC", name: "USD Coin", address: CONTRACT_ADDRESSES.usdc },
  { symbol: "WETH", name: "Wrapped Ether", address: CONTRACT_ADDRESSES.weth },
];

// Keyed by collateral asset (not freely selectable) since each oracle is
// calibrated for one specific collateral/borrow-asset pricing direction.
const ORACLES_BY_COLLATERAL: Record<string, { name: string; address: string; desc: string }> = {
  [CONTRACT_ADDRESSES.weth]: {
    name: "Mock Oracle (WETH collateral)",
    address: CONTRACT_ADDRESSES.collateralOracle,
    desc: "Fixed price: 1 WETH = 2000 units of the borrow asset.",
  },
  [CONTRACT_ADDRESSES.usdc]: {
    name: "Mock Oracle (USDC collateral)",
    address: CONTRACT_ADDRESSES.collateralOracleUsdc,
    desc: "Fixed price: 1 USDC = 0.0005 units of the borrow asset (the reciprocal of the WETH oracle above).",
  },
};

export default function CreateMarketPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { isAuthenticated } = useAuthStore();
  const { login, isSigningIn } = useSIWE();
  const createMarket = useCreateMarket();
  const { data: myRequest } = useMyBorrowerRequest();
  const requestAccessMutation = useRequestBorrowerAccess();
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState({
    borrower_address: address ?? "",
    borrow_asset: ASSETS[0].address,
    collateral_asset: ASSETS[1].address,
    min_collateral_ratio: 15000,
    liquidation_threshold: 9500,
    supply_cap: "50000000",
    borrow_cap: "40000000",
  });

  function setField(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const borrowAsset = ASSETS.find((a) => a.address === form.borrow_asset);
  const collateralAsset = ASSETS.find((a) => a.address === form.collateral_asset);
  // Derived, not user-selected - see ORACLES_BY_COLLATERAL above.
  const selectedOracle = ORACLES_BY_COLLATERAL[form.collateral_asset];

  // Decimals are read directly from each ERC20 contract, never hand-entered -
  // a mismatch here would silently corrupt every amount calculation the
  // market ever does (offers, collateral ratios, liquidations, etc).
  const { data: borrowAssetDecimals } = useReadContract({
    address: form.borrow_asset as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: localChain.id,
  });
  const { data: collateralAssetDecimals } = useReadContract({
    address: form.collateral_asset as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: localChain.id,
  });

  // deployMarket() requires the borrower to already be registered via
  // ArchController - check early so this doesn't only surface as a revert.
  const borrowerAddressValid = isAddress(form.borrower_address);
  const { data: isRegisteredBorrower, isLoading: registrationLoading } = useIsRegisteredBorrower(
    borrowerAddressValid ? (form.borrower_address as Address) : undefined
  );
  const borrowerBlocked = borrowerAddressValid && isRegisteredBorrower === false;
  const isOwnAddress = !!address && form.borrower_address.toLowerCase() === address.toLowerCase();

  async function handleDeploy() {
    if (!form.borrower_address || borrowAssetDecimals === undefined || collateralAssetDecimals === undefined || !selectedOracle) {
      return;
    }
    await createMarket.mutateAsync({
      borrower_address: form.borrower_address,
      borrow_asset: form.borrow_asset,
      borrow_asset_decimals: borrowAssetDecimals,
      collateral_asset: form.collateral_asset,
      collateral_asset_decimals: collateralAssetDecimals,
      collateral_oracle: selectedOracle.address,
      min_collateral_ratio: form.min_collateral_ratio,
      liquidation_threshold: form.liquidation_threshold,
    });
    router.push("/markets");
  }

  return (
    <div className="p-4 sm:p-6 max-w-300 mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Market Orchestrator</p>
        <h1 className="text-2xl font-semibold text-on-surface">Create Institutional Market</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Configure and deploy a custom lending market. Requires ETH for the factory deployment fee.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex gap-0 relative">
        {STEPS.map(({ n, label }, i) => (
          <div key={n} className="flex-1 flex items-center gap-2">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                step > n ? "bg-primary-container text-white" :
                step === n ? "bg-primary-container/20 border-2 border-primary-container text-primary" :
                "bg-surface-container-high text-on-surface-variant"
              )}>
                {step > n ? <Check className="h-4 w-4" /> : n}
              </div>
              <p className={cn("text-xs font-medium whitespace-nowrap hidden sm:block", step === n ? "text-primary" : "text-on-surface-variant")}>{label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mb-5 mx-2 transition-colors", step > n ? "bg-primary-container" : "bg-outline-variant/30")} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1 */}
          {step === 1 && (
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-on-surface">Asset Configuration</p>
                <span className="text-xs text-on-surface-variant">Step 1 of 4</span>
              </div>

              <Input
                label="Borrower Address"
                placeholder="0x…"
                value={form.borrower_address}
                onChange={(e) => setField("borrower_address", e.target.value)}
                hint="The wallet address that will borrow from this market"
              />

              {borrowerBlocked && (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-400/10 border border-amber-400/30 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Not a registered borrower</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {isOwnAddress
                          ? !isAuthenticated
                            ? "Sign in with your wallet to request borrower access."
                            : myRequest?.status === "pending"
                              ? "Your borrower access request is pending admin review."
                              : "This address must be approved by the protocol admin before a market can be created for it. Request access below."
                          : "This address must be approved by the protocol admin before a market can be created for it - only that wallet's owner can request access."}
                      </p>
                    </div>
                  </div>
                  {isOwnAddress && (
                    !isAuthenticated ? (
                      <Button size="sm" onClick={() => login()} loading={isSigningIn} className="shrink-0">
                        Sign In
                      </Button>
                    ) : myRequest?.status !== "pending" ? (
                      <Button
                        size="sm"
                        onClick={() => requestAccessMutation.mutate()}
                        loading={requestAccessMutation.isPending}
                        className="shrink-0"
                      >
                        {myRequest?.status === "rejected" ? "Request Again" : "Request Access"}
                      </Button>
                    ) : null
                  )}
                </div>
              )}
              {borrowerAddressValid && registrationLoading && (
                <p className="text-xs text-on-surface-variant">Checking borrower registration…</p>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-3">Base Asset (Borrowed)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ASSETS.map((a) => (
                    <button key={a.address}
                      onClick={() => setField("borrow_asset", a.address)}
                      className={cn("rounded-lg border p-3 text-left transition-all", form.borrow_asset === a.address ? "border-primary-container/60 bg-primary-container/10" : "border-outline-variant/20 hover:border-outline-variant/40")}>
                      <p className="text-sm font-bold text-on-surface">{a.symbol}</p>
                      <p className="text-xs text-on-surface-variant">{a.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-3">Collateral Asset</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ASSETS.map((a) => (
                    <button key={a.address}
                      onClick={() => setField("collateral_asset", a.address)}
                      className={cn("rounded-lg border p-3 text-left transition-all", form.collateral_asset === a.address ? "border-primary-container/60 bg-primary-container/10" : "border-outline-variant/20 hover:border-outline-variant/40")}>
                      <p className="text-sm font-bold text-on-surface">{a.symbol}</p>
                      <p className="text-xs text-on-surface-variant">{a.name}</p>
                    </button>
                  ))}
                </div>
              </div>

            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-on-surface">Risk Parameters</p>
                <span className="text-xs text-on-surface-variant">Step 2 of 4</span>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Min Collateral Ratio (BPS)</label>
                  <span className="text-sm font-bold text-primary">{(form.min_collateral_ratio / 100).toFixed(1)}%</span>
                </div>
                {/* Contract-enforced bounds: RevvFiFactory._validateRatios requires
                    >= MIN_CR (11000 = 110%), and RevvFiCollateralEscrow.setMinCollateralRatio
                    - called right after, in the same deployMarket() flow - independently
                    caps it at BP*2 (20000 = 200%), which binds tighter than the factory's
                    own 500% ceiling (verified on-chain: 20000 succeeds, 20100 reverts). */}
                <input type="range" min={11000} max={20000} step={100} value={form.min_collateral_ratio}
                  onChange={(e) => setField("min_collateral_ratio", parseInt(e.target.value))}
                  className="w-full accent-primary-container" />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>Aggressive (110%)</span><span>Conservative (200%)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Liquidation Threshold (BPS)</label>
                  <span className="text-sm font-bold text-amber-400">{(form.liquidation_threshold / 100).toFixed(1)}%</span>
                </div>
                {/* Contract requires liquidationThreshold to be well BELOW
                    minCollateralRatio (at least a 500bps buffer), not above it -
                    and always under 10000 (100%). Since minCollateralRatio's own
                    floor (11000) already exceeds 10000 - 500, the 100-9900 range
                    is always valid regardless of the min collateral ratio chosen. */}
                <input type="range" min={100} max={9900} step={100} value={form.liquidation_threshold}
                  onChange={(e) => setField("liquidation_threshold", parseInt(e.target.value))}
                  className="w-full accent-amber-400" />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>Liquidate Early (1%)</span><span>Liquidate Late (99%)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-3">Oracle</label>
                {/* Auto-derived from the collateral asset, not a free choice -
                    a market with the wrong oracle for its pairing direction
                    produces silently-wrong collateral values (see
                    ORACLES_BY_COLLATERAL above for why). */}
                {selectedOracle ? (
                  <div className="rounded-lg border border-primary-container/60 bg-primary-container/10 p-4">
                    <p className="text-sm font-semibold text-on-surface">{selectedOracle.name}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{selectedOracle.desc}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
                    <p className="text-sm font-semibold text-amber-400">No oracle configured for this collateral asset</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <Card className="p-6 space-y-4">
              <p className="text-sm font-bold text-on-surface">Review Configuration</p>
              <div className="space-y-2">
                {[
                  ["Borrower", form.borrower_address],
                  ["Borrow Asset", borrowAsset?.symbol ?? "—"],
                  ["Collateral Asset", collateralAsset?.symbol ?? "—"],
                  ["Min Collateral Ratio", `${(form.min_collateral_ratio / 100).toFixed(1)}% (${form.min_collateral_ratio} BPS)`],
                  ["Liquidation Threshold", `${(form.liquidation_threshold / 100).toFixed(1)}% (${form.liquidation_threshold} BPS)`],
                  ["Oracle", selectedOracle?.name ?? "—"],
                  ["Oracle Address", selectedOracle?.address ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-outline-variant/10 text-sm">
                    <span className="text-on-surface-variant shrink-0 mr-4">{k}</span>
                    <span className="font-medium text-on-surface text-right mono text-xs">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                <p className="text-xs text-amber-400">
                  ⚠ Deploying will trigger two MetaMask prompts: (1) read deployment fee, (2) sign the deployMarket transaction with ETH value.
                </p>
              </div>
            </Card>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <Card className="p-6 flex flex-col items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-primary-container/15 flex items-center justify-center">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-on-surface">Ready to Deploy</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  MetaMask will prompt for the factory deployment fee (ETH). Confirm to create the market on-chain.
                </p>
              </div>
              <Button
                size="xl"
                onClick={handleDeploy}
                loading={createMarket.isPending}
                disabled={!form.borrower_address || borrowAssetDecimals === undefined || collateralAssetDecimals === undefined || borrowerBlocked || !selectedOracle}
                className="gap-2"
              >
                <Rocket className="h-5 w-5" /> Deploy Market On-Chain
              </Button>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => step > 1 && setStep((s) => (s - 1) as Step)} disabled={step === 1} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            {step < 4 && (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={step === 1 && (!borrowerAddressValid || borrowerBlocked)}
                className="gap-2"
              >
                {step === 3 ? "Confirm & Deploy" : "Next"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview */}
        <Card className="p-5 h-fit lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Market Preview</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-sm font-bold text-primary">
              {borrowAsset?.symbol?.[0] ?? "?"}
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{borrowAsset?.symbol ?? "—"} / {collateralAsset?.symbol ?? "—"}</p>
              <p className="text-xs text-on-surface-variant">Institutional Isolated Pool</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            {[
              ["Min LTV", `${(form.min_collateral_ratio / 100).toFixed(1)}%`],
              ["Liq. Threshold", `${(form.liquidation_threshold / 100).toFixed(1)}%`],
              ["Oracle", selectedOracle ? selectedOracle.name.split(" ")[0] : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-on-surface-variant">{k}</span>
                <span className="font-medium text-on-surface">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
