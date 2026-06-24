"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useCreateMarket } from "@/hooks/useMarkets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "Asset Selection" },
  { n: 2, label: "Risk Parameters" },
  { n: 3, label: "Review" },
  { n: 4, label: "Deployment" },
];

const ASSETS = [
  { symbol: "USDC", name: "USD Coin", address: "0x5FbDB2315678afecb367f032d93F642f64180aa3" },
  { symbol: "WETH", name: "Wrapped Ether", address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" },
];

const ORACLES = [
  { name: "Mock Oracle", desc: "Local testing oracle with fixed prices." },
];

const ORACLE_ADDRESSES = [
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Mock Oracle
];

export default function CreateMarketPage() {
  const router = useRouter();
  const { address } = useAccount();
  const createMarket = useCreateMarket();
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState({
    borrower_address: address ?? "",
    borrow_asset: ASSETS[0].address,
    borrow_asset_decimals: 6,
    collateral_asset: ASSETS[1].address,
    collateral_asset_decimals: 18,
    selectedOracle: 0,
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

  async function handleDeploy() {
    if (!form.borrower_address) {
      return;
    }
    await createMarket.mutateAsync({
      borrower_address: form.borrower_address,
      borrow_asset: form.borrow_asset,
      borrow_asset_decimals: form.borrow_asset_decimals,
      collateral_asset: form.collateral_asset,
      collateral_asset_decimals: form.collateral_asset_decimals,
      collateral_oracle: ORACLE_ADDRESSES[form.selectedOracle],
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

              <div className="grid grid-cols-2 gap-4">
                <Input label="Borrow Asset Decimals" type="number" value={form.borrow_asset_decimals.toString()}
                  onChange={(e) => setField("borrow_asset_decimals", parseInt(e.target.value))} />
                <Input label="Collateral Asset Decimals" type="number" value={form.collateral_asset_decimals.toString()}
                  onChange={(e) => setField("collateral_asset_decimals", parseInt(e.target.value))} />
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
                <input type="range" min={5000} max={9500} step={100} value={form.min_collateral_ratio}
                  onChange={(e) => setField("min_collateral_ratio", parseInt(e.target.value))}
                  className="w-full accent-primary-container" />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>Conservative (50%)</span><span>Aggressive (95%)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Liquidation Threshold (BPS)</label>
                  <span className="text-sm font-bold text-amber-400">{(form.liquidation_threshold / 100).toFixed(1)}%</span>
                </div>
                <input type="range" min={form.min_collateral_ratio} max={9900} step={100} value={form.liquidation_threshold}
                  onChange={(e) => setField("liquidation_threshold", parseInt(e.target.value))}
                  className="w-full accent-amber-400" />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>Safe Margin</span><span>High Risk</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-3">Oracle</label>
                <div className="grid grid-cols-2 gap-3">
                  {ORACLES.map((o, i) => (
                    <button key={o.name} onClick={() => setField("selectedOracle", i)}
                      className={cn("rounded-lg border p-4 text-left transition-all", form.selectedOracle === i ? "border-primary-container/60 bg-primary-container/10" : "border-outline-variant/20 hover:border-outline-variant/40")}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center", form.selectedOracle === i ? "border-primary-container" : "border-outline-variant")}>
                          {form.selectedOracle === i && <div className="h-2 w-2 rounded-full bg-primary-container" />}
                        </div>
                        <p className="text-sm font-semibold text-on-surface">{o.name}</p>
                      </div>
                      <p className="text-xs text-on-surface-variant">{o.desc}</p>
                    </button>
                  ))}
                </div>
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
                  ["Borrow Asset", `${borrowAsset?.symbol ?? "—"} (${form.borrow_asset_decimals} dec)`],
                  ["Collateral Asset", `${collateralAsset?.symbol ?? "—"} (${form.collateral_asset_decimals} dec)`],
                  ["Min Collateral Ratio", `${(form.min_collateral_ratio / 100).toFixed(1)}% (${form.min_collateral_ratio} BPS)`],
                  ["Liquidation Threshold", `${(form.liquidation_threshold / 100).toFixed(1)}% (${form.liquidation_threshold} BPS)`],
                  ["Oracle", ORACLES[form.selectedOracle].name],
                  ["Oracle Address", ORACLE_ADDRESSES[form.selectedOracle]],
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
                disabled={!form.borrower_address}
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
              <Button onClick={() => setStep((s) => (s + 1) as Step)} className="gap-2">
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
              ["Oracle", ORACLES[form.selectedOracle].name.split(" ")[0]],
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
