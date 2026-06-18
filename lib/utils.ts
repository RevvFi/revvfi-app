import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a wei string to a human-readable number
export function formatTokenAmount(
  wei: string,
  decimals = 6,
  displayDecimals = 2
): string {
  if (!wei || wei === "0") return "0.00";
  try {
    const value = BigInt(wei);
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    const fraction = remainder
      .toString()
      .padStart(decimals, "0")
      .slice(0, displayDecimals);
    return `${whole.toLocaleString()}.${fraction}`;
  } catch {
    return "0.00";
  }
}

export function formatUSD(wei: string, decimals = 6): string {
  const amount = parseFloat(wei) / Math.pow(10, decimals);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatAPR(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(unix: number): string {
  if (!unix || unix < 0) return "—";
  const date = new Date(unix * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(unix: number): string {
  if (!unix || unix < 0) return "—";
  const now = Date.now() / 1000;
  const diff = unix - now;
  if (Math.abs(diff) < 60) return "just now";
  if (Math.abs(diff) < 3600) return `${Math.round(Math.abs(diff) / 60)}m ${diff > 0 ? "left" : "ago"}`;
  if (Math.abs(diff) < 86400) return `${Math.round(Math.abs(diff) / 3600)}h ${diff > 0 ? "left" : "ago"}`;
  return `${Math.round(Math.abs(diff) / 86400)}d ${diff > 0 ? "left" : "ago"}`;
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatBigWei(wei: string, decimals = 6): string {
  const n = parseFloat(wei) / Math.pow(10, decimals);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export function reputationColor(score: number): string {
  if (score >= 700) return "text-emerald-400";
  if (score >= 500) return "text-amber-400";
  if (score >= 300) return "text-orange-400";
  return "text-red-400";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: "text-emerald-400",
    healthy: "text-emerald-400",
    confirmed: "text-emerald-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
    pending: "text-amber-400",
    processing: "text-amber-400",
    partially_filled: "text-amber-400",
    liquidating: "text-orange-400",
    error: "text-red-400",
    danger: "text-red-400",
    cancelled: "text-red-400",
    defaulted: "text-red-400",
    inactive: "text-on-surface-variant",
    settled: "text-on-surface-variant",
    filled: "text-on-surface-variant",
    expired: "text-on-surface-variant",
    halted: "text-red-400",
  };
  return map[status.toLowerCase()] ?? "text-on-surface-variant";
}

export function statusBg(status: string): string {
  const map: Record<string, string> = {
    active: "bg-emerald-400/10 text-emerald-400",
    healthy: "bg-emerald-400/10 text-emerald-400",
    confirmed: "bg-emerald-400/10 text-emerald-400",
    success: "bg-emerald-400/10 text-emerald-400",
    pending: "bg-amber-400/10 text-amber-400",
    processing: "bg-amber-400/10 text-amber-400",
    partially_filled: "bg-amber-400/10 text-amber-400",
    warning: "bg-amber-400/10 text-amber-400",
    liquidating: "bg-orange-400/10 text-orange-400",
    cancelled: "bg-red-400/10 text-red-400",
    defaulted: "bg-red-400/10 text-red-400",
    halted: "bg-red-400/10 text-red-400",
    settled: "bg-white/5 text-on-surface-variant",
    filled: "bg-white/5 text-on-surface-variant",
    expired: "bg-white/5 text-on-surface-variant",
    inactive: "bg-white/5 text-on-surface-variant",
  };
  return map[status.toLowerCase()] ?? "bg-white/5 text-on-surface-variant";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}
