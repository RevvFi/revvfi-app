"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useMarkets } from "@/hooks/useMarkets";
import { formatAPR } from "@/lib/utils";
import { Search, SlidersHorizontal, RefreshCw, Plus } from "lucide-react";
import type { Market, Asset } from "@/types";

// ── Token logo CDN (atomiclabs via jsDelivr — highly reliable, no API key) ──
const ICO =
  "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa/128/color";

const LOGOS: Record<string, string> = {
  USDC:  `${ICO}/usdc.png`,
  USDT:  `${ICO}/usdt.png`,
  ETH:   `${ICO}/eth.png`,
  WETH:  `${ICO}/eth.png`,
  BTC:   `${ICO}/btc.png`,
  WBTC:  `${ICO}/wbtc.png`,
  DAI:   `${ICO}/dai.png`,
  LINK:  `${ICO}/link.png`,
  AAVE:  `${ICO}/aave.png`,
  MKR:   `${ICO}/mkr.png`,
  ARB:   `${ICO}/arb.png`,
  UNI:   `${ICO}/uni.png`,
  MATIC: `${ICO}/matic.png`,
  OP:    `${ICO}/op.png`,
  SNX:   `${ICO}/snx.png`,
  CRV:   `${ICO}/crv.png`,
  COMP:  `${ICO}/comp.png`,
  SUSHI: `${ICO}/sushi.png`,
  YFI:   `${ICO}/yfi.png`,
};

const ETH_LOGO = `${ICO}/eth.png`;

const COLORS: Record<string, string> = {
  USDC: "#2775CA", USDT: "#26A17B",
  WETH: "#627EEA", ETH:  "#627EEA",
  WBTC: "#F7931A", BTC:  "#F7931A",
  DAI:  "#F5AC37", ARB:  "#28A0F0",
  LINK: "#375BD2", AAVE: "#B6509E",
  MKR:  "#1AAB9B", UNI:  "#FF007A",
  // newer tokens with no atomiclabs entry — use a brand-matched color
  cbBTC:  "#F7931A",
  wstETH: "#00A3FF",
  cbETH:  "#0052FF",
  USDe:   "#A78BFA",
  stETH:  "#00A3FF",
};

// ── Token icon — useState-based fallback ──────────────────────────────────

function TokenIcon({ symbol, size = 32 }: { symbol?: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  const sym = symbol ?? "";
  const logoUrl = LOGOS[sym] ?? LOGOS[sym.toUpperCase()];
  const color = COLORS[sym] ?? COLORS[sym.toUpperCase()] ?? "#FF6A00";
  const abbr = (sym || "?").slice(0, 4).toUpperCase();
  const showImg = !!logoUrl && !failed;

  return (
    <div className="shrink-0 rounded-full overflow-hidden" style={{ width: size, height: size }}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={sym}
          width={size}
          height={size}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-bold"
          style={{ backgroundColor: color + "22", color, fontSize: Math.floor(size * 0.33) }}
        >
          {abbr}
        </div>
      )}
    </div>
  );
}

// ── Ethereum network icon ─────────────────────────────────────────────────

function EthIcon({ size = 16 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: "#627EEA22", color: "#627EEA", fontSize: size * 0.5 }}
    >
      Ξ
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ETH_LOGO}
      alt="ETH"
      width={size}
      height={size}
      className="rounded-full shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

// ── Utilization bar — orange fill on dark track ───────────────────────────

function UtilBar({ rate }: { rate: number }) {
  const pct = Math.min(rate * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-[#1A1A1A] overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-[#FF6A00] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[#9CA3AF] w-9 tabular-nums">{pct.toFixed(0)}%</span>
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

// ── Row model ─────────────────────────────────────────────────────────────

type RowType = "Loan" | "Collateral";

interface MarketRow {
  key: string;
  asset: Asset;
  secondaryAsset?: Asset;
  type: RowType;
  market: Market;
}

function buildRows(markets: Market[], filter: string): MarketRow[] {
  const rows: MarketRow[] = [];
  for (const m of markets) {
    if (filter === "All" || filter === "Advanced") {
      // Show one combined row per market — no duplicates
      rows.push({ key: `${m.address}-market`, asset: m.borrow_asset, secondaryAsset: m.collateral_asset, type: "Loan", market: m });
    } else {
      if (filter !== "Collateral") {
        rows.push({ key: `${m.address}-loan`, asset: m.borrow_asset,     type: "Loan",       market: m });
      }
      if (filter !== "Loan") {
        rows.push({ key: `${m.address}-col`,  asset: m.collateral_asset, type: "Collateral", market: m });
      }
    }
  }
  return rows;
}

// ── Action button ─────────────────────────────────────────────────────────

function ActionBtn({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center justify-center h-7 px-4 rounded text-xs font-semibold text-white bg-[#FF6A00] hover:bg-[#e55f00] transition-colors"
    >
      {label}
    </Link>
  );
}

// ── Table header cell ─────────────────────────────────────────────────────

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] whitespace-nowrap ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type TypeFilter = "All" | "Loan" | "Collateral" | "Advanced";
type ViewMode   = "All" | "My";

export default function MarketsPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [viewMode, setViewMode]     = useState<ViewMode>("All");
  const [activeFilter]              = useState<boolean | undefined>(undefined);

  // ← data query: untouched
  const { data, isLoading, refetch, isFetching } = useMarkets({
    is_active: activeFilter,
    limit: 50,
  });

  // Search + view-mode filter — purely client-side, no query changes
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

  const rows = buildRows(markets, typeFilter);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1A1A1A]">
        <div>
          <h1 className="text-[15px] font-semibold text-[#E6E6E6]">Markets</h1>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Institutional fixed-rate lending — real-time
          </p>
        </div>
        <Link
          href="/markets/create"
          className="flex items-center gap-1.5 h-8 px-4 rounded bg-[#FF6A00] hover:bg-[#e55f00] text-white text-xs font-semibold transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Create Market</span>
        </Link>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[#1A1A1A] px-4 sm:px-6 overflow-x-auto">
        {/* All / My toggle — only shown when wallet is connected */}
        {address && (
          <>
            <div className="flex items-center h-11 gap-0.5 mr-3 shrink-0">
              {(["All", "My"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`h-7 px-3 rounded text-[12px] font-medium transition-colors whitespace-nowrap ${
                    viewMode === mode
                      ? "bg-[#FF6A00]/15 text-[#FF6A00]"
                      : "text-[#9CA3AF] hover:text-[#E6E6E6]"
                  }`}
                >
                  {mode === "My" ? "My Markets" : "All Markets"}
                </button>
              ))}
            </div>
            <div className="h-5 w-px bg-[#1A1A1A] mr-3 shrink-0" />
          </>
        )}

        {/* Type tabs */}
        <div className="flex items-center h-11 overflow-x-auto">
          {(["All", "Loan", "Collateral", "Advanced"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center h-full px-4 text-[13px] font-medium border-b-2 transition-colors duration-150 whitespace-nowrap ${
                typeFilter === t
                  ? "text-[#FF6A00] border-[#FF6A00]"
                  : "text-[#9CA3AF] border-transparent hover:text-[#E6E6E6]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2 pl-4 shrink-0">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF] pointer-events-none" />
            <input
              className="h-8 w-44 lg:w-52 rounded border border-[#1A1A1A] bg-[#111111] pl-8 pr-3 text-[13px] text-[#E6E6E6] placeholder:text-[#9CA3AF]/60 focus:border-[#2D2D2D] focus:outline-none transition-colors"
              placeholder="Search markets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter toggle */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded border border-[#1A1A1A] text-[#9CA3AF] hover:text-[#E6E6E6] hover:border-[#2D2D2D] transition-colors"
            title="Filter"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>

          {/* Refresh */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded border border-[#1A1A1A] text-[#9CA3AF] hover:text-[#E6E6E6] hover:border-[#2D2D2D] transition-colors"
            title="Refresh"
            onClick={() => refetch()}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px] border-collapse min-w-[700px]">
          <thead className="sticky top-0 bg-[#0A0A0A] z-10">
            <tr className="border-b border-[#1A1A1A]">
              <TH>Asset</TH>
              <TH>Type</TH>
              <TH>Network</TH>
              <TH right>Total Market Size</TH>
              <TH right>Total Liquidity</TH>
              <TH>Utilization</TH>
              <TH right>APR</TH>
              <TH right>Actions</TH>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#111111]">
                  {[180, 80, 100, 120, 120, 150, 70, 90].map((w, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 rounded shimmer" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-24 text-center">
                  <p className="text-[#9CA3AF] text-sm">No markets found</p>
                  {search && (
                    <p className="text-[#9CA3AF]/50 text-xs mt-1">
                      Try clearing your search
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const m = row.market;
                const dec = row.asset.decimals || 6;
                const isLoan = row.type === "Loan";
                const isCombined = !!row.secondaryAsset;

                return (
                  <tr
                    key={row.key}
                    onClick={() => router.push(`/markets/${m.address}`)}
                    className="border-b border-[#111111] cursor-pointer transition-colors hover:bg-[#111111] group"
                  >
                    {/* Asset */}
                    <td className="px-4 sm:px-6 py-3.5">
                      {isCombined ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 shrink-0">
                            <TokenIcon symbol={row.asset.symbol} size={26} />
                            <span className="text-[#9CA3AF] text-xs mx-0.5">→</span>
                            <TokenIcon symbol={row.secondaryAsset!.symbol} size={26} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#E6E6E6] leading-none">
                              {row.asset.symbol} → {row.secondaryAsset!.symbol}
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-mono truncate">
                              {m.address.slice(0, 6)}…{m.address.slice(-4)}
                            </p>
                            {address && m.borrower.toLowerCase() === address.toLowerCase() && (
                              <span className="inline-flex items-center h-4 px-1.5 mt-1 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400">
                                You: Borrower
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <TokenIcon symbol={row.asset.symbol} size={32} />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#E6E6E6] leading-none">
                              {row.asset.symbol || "—"}
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-mono truncate">
                              {m.address.slice(0, 6)}…{m.address.slice(-4)}
                            </p>
                            {address && isLoan && m.borrower.toLowerCase() === address.toLowerCase() && (
                              <span className="inline-flex items-center h-4 px-1.5 mt-1 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400">
                                You: Borrower
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      {isCombined ? (
                        <div className="space-y-0.5">
                          <p className="text-[11px] text-[#9CA3AF]">
                            Borrow: <span className="text-[#E6E6E6]">{row.asset.symbol}</span>
                          </p>
                          <p className="text-[11px] text-[#9CA3AF]">
                            Collateral: <span className="text-[#E6E6E6]">{row.secondaryAsset!.symbol}</span>
                          </p>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center h-5 px-2 rounded text-[11px] font-semibold ${
                            isLoan
                              ? "bg-[#FF6A00]/10 text-[#FF6A00]"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {row.type}
                        </span>
                      )}
                    </td>

                    {/* Network */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <EthIcon size={16} />
                        <span className="text-[#9CA3AF]">Ethereum</span>
                      </div>
                    </td>

                    {/* Total Market Size */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono text-[#E6E6E6]">
                        {fmtUSD(m.total_principal, dec)}
                      </span>
                    </td>

                    {/* Total Liquidity */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono text-[#9CA3AF]">
                        {fmtUSD(m.total_liquidity, dec)}
                      </span>
                    </td>

                    {/* Utilization */}
                    <td className="px-4 py-3.5">
                      <UtilBar rate={m.utilization_rate} />
                    </td>

                    {/* APR */}
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="font-mono font-semibold"
                        style={{ color: m.weighted_apr > 0 ? "#FF6A00" : "#9CA3AF" }}
                      >
                        {formatAPR(m.weighted_apr)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-3.5 text-right">
                      <ActionBtn
                        href={isCombined ? `/markets/${m.address}` : isLoan ? "/borrow" : "/lend"}
                        label={isCombined ? "View" : isLoan ? "Borrow" : "Supply"}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-[#1A1A1A] text-[11px] text-[#9CA3AF]">
        <span>
          {rows.length} {(typeFilter === "All" || typeFilter === "Advanced") ? "market" : "asset"}{rows.length !== 1 ? "s" : ""} ·{" "}
          {data?.count ?? 0} total market{(data?.count ?? 0) !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] pulse-dot" />
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}
