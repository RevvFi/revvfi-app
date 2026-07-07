"use client";

import { cn } from "@/lib/utils";

// SVG ring uses a fixed viewBox — CSS size handles scaling
const R = 40;       // radius in SVG units
const SW = 8;       // stroke-width in SVG units
const CIRC = 2 * Math.PI * R; // ≈ 251.3

// Health factor zones (matches Aave / Morpho conventions)
function hfStyle(hf: number) {
  if (hf <= 0) return { stroke: "#2c1c17", track: "#2c1c17", text: "text-on-surface-variant", label: "No Position" };
  if (hf >= 2.0) return { stroke: "#4ade80", track: "#1a2e1a", text: "text-emerald-400", label: "Safe" };
  if (hf >= 1.3) return { stroke: "#fbbf24", track: "#2a2010", text: "text-amber-400",  label: "Caution" };
  if (hf >= 1.1) return { stroke: "#fb923c", track: "#2a1a10", text: "text-orange-400", label: "Warning" };
  return              { stroke: "#f87171", track: "#2a1010", text: "text-red-400",    label: "At Risk" };
}

// Used when the on-chain health-factor read fails (e.g. stale oracle) instead
// of silently falling back to a possibly-wrong cached number with full
// visual confidence.
const HF_UNKNOWN_STYLE = { stroke: "#6b7280", track: "#2a2a2a", text: "text-on-surface-variant", label: "Unable to Verify" };

const SIZES = {
  sm: { wrap: "h-16 w-16", num: "text-sm",  lbl: "text-[9px]"  },
  md: { wrap: "h-24 w-24", num: "text-xl",  lbl: "text-[10px]" },
  lg: { wrap: "h-32 w-32", num: "text-2xl", lbl: "text-xs"     },
};

interface HealthFactorRingProps {
  /** Raw health factor value (0 = no position / no data) */
  value: number;
  /** True when the on-chain read failed (e.g. stale oracle) — shows an
   *  explicit "unable to verify" state instead of trusting `value`, which
   *  may be a stale/wrong cached fallback. */
  error?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}

export function HealthFactorRing({ value, error = false, size = "md", className }: HealthFactorRingProps) {
  const { wrap, num, lbl } = SIZES[size];
  const { stroke, track, text, label } = error ? HF_UNKNOWN_STYLE : hfStyle(value);

  // Scale 0 → 3.0 HF to 0 → 100% ring fill, capped at 100%
  const pct   = error || value <= 0 ? 0 : Math.min(value / 3, 1);
  const filled = CIRC * pct;
  const empty  = CIRC - filled;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className={cn("relative shrink-0", wrap)}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden>
          {/* Track */}
          <circle cx="50" cy="50" r={R} fill="none" stroke={track} strokeWidth={SW} />
          {/* Fill */}
          {pct > 0 && (
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke={stroke}
              strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${empty}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold mono leading-none", num, text)}>
            {error ? "?" : value <= 0 ? "—" : value.toFixed(2)}
          </span>
        </div>
      </div>
      <span className={cn("font-semibold uppercase tracking-widest leading-none", lbl, text)}>
        {label}
      </span>
    </div>
  );
}
