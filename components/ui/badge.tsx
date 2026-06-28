import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
}) {
  const variantClasses = {
    default: "bg-white/5 text-on-surface-variant",
    primary: "bg-primary-container/20 text-primary",
    success: "bg-emerald-400/10 text-emerald-400",
    warning: "bg-amber-400/10 text-amber-400",
    danger: "bg-red-400/10 text-red-400",
    info: "bg-tertiary/10 text-tertiary",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    active:      { label: "Active",      dot: "bg-emerald-400",  text: "text-emerald-400",  bg: "bg-emerald-400/10",  border: "border-emerald-400/20" },
    liquidating: { label: "Liquidating", dot: "bg-red-400",      text: "text-red-400",      bg: "bg-red-400/10",      border: "border-red-400/20" },
    pending:     { label: "Pending",     dot: "bg-amber-400",    text: "text-amber-400",    bg: "bg-amber-400/10",    border: "border-amber-400/20" },
    filled:      { label: "Filled",      dot: "bg-blue-400",     text: "text-blue-400",     bg: "bg-blue-400/10",     border: "border-blue-400/20" },
    settled:     { label: "Settled",     dot: "bg-emerald-400",  text: "text-emerald-400",  bg: "bg-emerald-400/10",  border: "border-emerald-400/20" },
    inactive:    { label: "Inactive",    dot: "bg-gray-400",     text: "text-gray-400",     bg: "bg-gray-400/10",     border: "border-gray-400/20" },
    paused:      { label: "Paused",      dot: "bg-amber-400",    text: "text-amber-400",    bg: "bg-amber-400/10",    border: "border-amber-400/20" },
  };

  const key = status?.toLowerCase() ?? "";
  const c = cfg[key] ?? { label: status, dot: "bg-gray-400", text: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20" };

  return (
    <span className={cn(`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${c.bg} ${c.border} ${c.text}`, className)}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function RiskBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    AAA: "bg-emerald-400/10 text-emerald-400",
    "AA+": "bg-emerald-400/10 text-emerald-400",
    AA: "bg-emerald-400/10 text-emerald-400",
    "AA-": "bg-emerald-400/10 text-emerald-400",
    A: "bg-blue-400/10 text-blue-400",
    BBB: "bg-amber-400/10 text-amber-400",
    BB: "bg-orange-400/10 text-orange-400",
    B: "bg-orange-400/10 text-orange-400",
    CCC: "bg-red-400/10 text-red-400",
    CC: "bg-red-400/10 text-red-400",
    C: "bg-red-400/10 text-red-400",
    D: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-bold tracking-wider",
        colorMap[label] ?? "bg-white/5 text-on-surface-variant"
      )}
    >
      {label}
    </span>
  );
}
