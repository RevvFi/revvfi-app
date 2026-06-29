"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useMarkets } from "@/hooks/useMarkets";
import { formatAPR } from "@/lib/utils";
import { Search, SlidersHorizontal, RefreshCw, Plus, TrendingUp, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CopyButton } from "@/components/ui/copy-button";
import type { Market, Asset } from "@/types";

// ── Token logo CDN ────────────────────────────────────────────────────────
const ICO =
  "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa/128/color";

const LOGOS: Record<string, string> = {
  USDC:  `${ICO}/usdc.png`,  USDT:  `${ICO}/usdt.png`,
  ETH:   `${ICO}/eth.png`,   WETH:  `${ICO}/eth.png`,
  BTC:   `${ICO}/btc.png`,   WBTC:  `${ICO}/wbtc.png`,
  DAI:   `${ICO}/dai.png`,   LINK:  `${ICO}/link.png`,
  AAVE:  `${ICO}/aave.png`,  MKR:   `${ICO}/mkr.png`,
  ARB:   `${ICO}/arb.png`,   UNI:   `${ICO}/uni.png`,
  MATIC: `${ICO}/matic.png`, OP:    `${ICO}/op.png`,
  SNX:   `${ICO}/snx.png`,   CRV:   `${ICO}/crv.png`,
  COMP:  `${ICO}/comp.png`,
};

const ETH_LOGO = `${ICO}/eth.png`;

const COLORS: Record<string, string> = {
  USDC: "#2775CA", USDT: "#26A17B",
  WETH: "#627EEA", ETH:  "#627EEA",
  WBTC: "#F7931A", BTC:  "#F7931A",
  DAI:  "#F5AC37", ARB:  "#28A0F0",
  LINK: "#375BD2", AAVE: "#B6509E",
  MKR:  "#1AAB9B", UNI:  "#FF007A",
  cbBTC: "#F7931A", wstETH: "#00A3FF",
  cbETH: "#0052FF", USDe:   "#A78BFA",
  stETH: "#00A3FF",
};

// ── Token icon ────────────────────────────────────────────────────────────
function TokenIcon({ symbol, size = 28 }: { symbol?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const sym = symbol ?? "";
  const logoUrl = LOGOS[sym] ?? LOGOS[sym.toUpperCase()];
  const color = COLORS[sym] ?? COLORS[sym.toUpperCase()] ?? "#FF6A00";
  const abbr = (sym || "?").slice(0, 3).toUpperCase();
  const showImg = !!logoUrl && !failed;

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 ring-2 ring-surface-container-high"
      style={{ width: size, height: size }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl} alt={sym} width={size} height={size}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-bold"
          style={{ backgroundColor: color + "28", color, fontSize: Math.floor(size * 0.33) }}
        >
          {abbr}
        </div>
      )}
    </div>
  );
}

// ── Overlapping token pair ────────────────────────────────────────────────
function TokenPairIcons({ borrow, collateral }: { borrow?: Asset; collateral?: Asset }) {
  return (
    <div className="flex items-center shrink-0" style={{ width: 52 }}>
      <TokenIcon symbol={borrow?.symbol} size={28} />
      <div style={{ marginLeft: -10 }}>
        <TokenIcon symbol={collateral?.symbol} size={28} />
      </div>
    </div>
  );
}

// ── Network icon ─────────────────────────────────────────────────────────
function EthIcon({ size = 16 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: "#627EEA22", color: "#627EEA", fontSize: size * 0.5 }}
    >Ξ</div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ETH_LOGO} alt="ETH" width={size} height={size}
      className="rounded-full shrink-0 object-contain" onError={() => setFailed(true)} />
  );
}

// ── Utilization bar ───────────────────────────────────────────────────────
function UtilBar({ rate }: { rate: number }) {
  const pct = Math.min(rate * 100, 100);
  const color = pct > 80 ? "#EF4444" : pct > 60 ? "#F59E0B" : "#FF6A00";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 rounded-full bg-outline-variant overflow-hidden shrink-0">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs mono text-on-surface-variant tabular-nums w-8">{pct.toFixed(0)}%</span>
    </div>
  );
}

// ── Compact USD formatter ─────────────────────────────────────────────────
function fmtUSD(raw: string, decimals = 6): string {
  if (!raw || raw === "0") return "—";
  const n = parseFloat(raw) / Math.pow(10, decimals);
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtRaw(raw: string, decimals = 6): string {
  if (!raw || raw === "0") return "—";
  const n = parseFloat(raw) / Math.pow(10, decimals);
  if (!n) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

// ── Row model ─────────────────────────────────────────────────────────────
type TypeFilter = "All" | "Loan" | "Collateral" | "Advanced";
type ViewMode   = "All" | "My";

// ── Page ──────────────────────────────────────────────────────────────────
export default function MarketsPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [viewMode, setViewMode]     = useState<ViewMode>("All");

  const { data, isLoading, refetch, isFetching } = useMarkets({ is_active: undefined, limit: 50 });

  const markets = (data?.markets ?? []).filter((m) => {
    if (viewMode === "My" && address) {
      if (m.borrower.toLowerCase() !== address.toLowerCase()) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.borrow_asset.symbol?.toLowerCase().includes(q) ||
      m.collateral_asset.symbol?.toLowerCase().includes(q) ||
      m.address.toLowerCase().includes(q) ||
      m.borrower.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Filter / toolbar bar ───────────────────────────────────────── */}
      <div className="flex items-center border-b border-outline-variant px-4 sm:px-6 gap-2 overflow-x-auto">

        {/* Type tabs */}
        <div className="flex items-center h-12 overflow-x-auto shrink-0">
          {(["All", "Loan", "Collateral", "Advanced"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 h-full px-3.5 text-[13px] font-medium border-b-2 transition-colors duration-150 whitespace-nowrap ${
                typeFilter === t
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-on-surface"
              }`}
            >
              {t === "Advanced" && <SlidersHorizontal className="h-3 w-3" />}
              {t}
            </button>
          ))}
        </div>

        {/* My Markets toggle */}
        {address && (
          <div className="flex items-center h-6 rounded-full border border-outline-variant overflow-hidden shrink-0 ml-1">
            {(["All", "My"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`h-full px-3 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  viewMode === mode
                    ? "bg-primary/15 text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {mode === "My" ? "My Markets" : "All"}
              </button>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant pointer-events-none" />
            <input
              className="h-7 w-44 lg:w-52 rounded-full border border-outline-variant bg-surface-container-low pl-8 pr-3 text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-outline focus:outline-none transition-colors"
              placeholder="Filter markets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="h-7 w-7 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors"
            title="Refresh"
            onClick={() => refetch()}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/markets/create"
            className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-[12px] font-semibold transition-colors shrink-0"
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:block">New Market</span>
          </Link>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px] border-collapse min-w-190">

          {/* Header */}
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b border-outline-variant">
              <th className="px-4 sm:px-6 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Network</span>
              </th>
              <th className="px-4 py-3 text-left">
                <button className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">
                  Market <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button className="flex items-center gap-1 ml-auto text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">
                  Deposits <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button className="flex items-center gap-1 ml-auto text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">
                  Liquidity <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Utilization</span>
              </th>
              <th className="px-4 py-3 text-right">
                <button className="flex items-center gap-1 ml-auto text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">
                  APR <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 sm:px-6 py-3" />
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-outline-variant/40">
                  {[48, 200, 100, 100, 130, 60, 70].map((w, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 rounded shimmer" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : markets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8">
                  <EmptyState
                    icon={TrendingUp}
                    title="No Active Markets"
                    description="No markets match your filters. Try adjusting your search or create a new market."
                    action={() => router.push("/markets/create")}
                    actionLabel="Create Market"
                  />
                </td>
              </tr>
            ) : (
              markets.map((m: Market) => {
                const dec = m.borrow_asset.decimals || 6;
                const isOwn = !!address && m.borrower.toLowerCase() === address.toLowerCase();
                const symbol = `${m.borrow_asset.symbol ?? "?"} / ${m.collateral_asset.symbol ?? "?"}`;
                const rawAmt = fmtRaw(m.total_principal, dec);
                const usdAmt = fmtUSD(m.total_principal, dec);
                const rawLiq = fmtRaw(m.total_liquidity, dec);
                const usdLiq = fmtUSD(m.total_liquidity, dec);

                return (
                  <tr
                    key={m.address}
                    onClick={() => router.push(`/markets/${m.address}`)}
                    className="border-b border-outline-variant/30 cursor-pointer transition-colors hover:bg-surface-container group"
                  >
                    {/* Network */}
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-8 w-8 rounded-full bg-[#627EEA]/10 flex items-center justify-center">
                        <EthIcon size={18} />
                      </div>
                    </td>

                    {/* Market */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <TokenPairIcons borrow={m.borrow_asset} collateral={m.collateral_asset} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-on-surface leading-none">{symbol}</p>
                            {isOwn && (
                              <span className="inline-flex h-4 items-center px-1.5 rounded text-[10px] font-semibold bg-primary/10 text-primary shrink-0">
                                Yours
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[11px] text-on-surface-variant mono">
                              {m.address.slice(0, 6)}…{m.address.slice(-4)}
                            </span>
                            <CopyButton text={m.address} label="Address" />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Deposits */}
                    <td className="px-4 py-4 text-right">
                      <p className="font-semibold mono text-on-surface">
                        {rawAmt} {m.borrow_asset.symbol ?? ""}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{usdAmt}</p>
                    </td>

                    {/* Liquidity */}
                    <td className="px-4 py-4 text-right">
                      <p className="font-semibold mono text-on-surface">
                        {rawLiq} {m.borrow_asset.symbol ?? ""}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{usdLiq}</p>
                    </td>

                    {/* Utilization */}
                    <td className="px-4 py-4">
                      <UtilBar rate={m.utilization_rate} />
                    </td>

                    {/* APR */}
                    <td className="px-4 py-4 text-right">
                      <span
                        className="font-semibold mono text-base"
                        style={{ color: m.weighted_apr > 0 ? "var(--color-primary)" : "var(--color-on-surface-variant)" }}
                      >
                        {formatAPR(m.weighted_apr)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <Link
                        href={`/markets/${m.address}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center h-7 px-4 rounded-full text-[12px] font-semibold text-on-primary bg-primary hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-outline-variant/40 text-[11px] text-on-surface-variant">
        <span>
          {markets.length} market{markets.length !== 1 ? "s" : ""} · {data?.count ?? 0} total
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] pulse-dot" />
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}
