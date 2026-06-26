"use client";

import { cn } from "@/lib/utils";

const TOKEN_COLORS: Record<string, { bg: string; text: string; letter: string }> = {
  WETH: { bg: "bg-purple-500/15", text: "text-purple-400", letter: "E" },
  ETH:  { bg: "bg-purple-500/15", text: "text-purple-400", letter: "E" },
  WBTC: { bg: "bg-amber-500/15",  text: "text-amber-400",  letter: "B" },
  BTC:  { bg: "bg-amber-500/15",  text: "text-amber-400",  letter: "B" },
  USDC: { bg: "bg-blue-500/15",   text: "text-blue-400",   letter: "U" },
  USDT: { bg: "bg-emerald-500/15",text: "text-emerald-400",letter: "T" },
  DAI:  { bg: "bg-yellow-500/15", text: "text-yellow-400", letter: "D" },
  LINK: { bg: "bg-blue-600/15",   text: "text-blue-500",   letter: "L" },
};

const SIZE_CLASSES = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

interface TokenIconProps {
  symbol: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function TokenIcon({ symbol, size = "md", className }: TokenIconProps) {
  const upper = symbol.toUpperCase();
  const style = TOKEN_COLORS[upper] ?? {
    bg: "bg-outline-variant/20",
    text: "text-on-surface-variant",
    letter: upper[0] ?? "?",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shrink-0",
        style.bg,
        style.text,
        SIZE_CLASSES[size],
        className
      )}
    >
      {style.letter}
    </div>
  );
}

export function TokenPair({
  from,
  to,
  size = "sm",
  className,
}: {
  from: string;
  to: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <TokenIcon symbol={from} size={size} />
      <TokenIcon symbol={to} size={size} className="-ml-2 ring-2 ring-surface-container" />
    </div>
  );
}
