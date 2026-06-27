import { cn, statusBg } from "@/lib/utils";

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

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusBg(status),
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
        "bg-emerald-400": ["active", "healthy", "confirmed", "success", "filled"].includes(status.toLowerCase()),
        "bg-amber-400": ["pending", "processing", "partially_filled", "warning"].includes(status.toLowerCase()),
        "bg-orange-400": ["liquidating"].includes(status.toLowerCase()),
        "bg-red-400": ["cancelled", "defaulted", "error", "halted", "liquidatable"].includes(status.toLowerCase()),
        "bg-gray-500": ["settled", "expired", "inactive"].includes(status.toLowerCase()),
      })} />
      {status.replace(/_/g, " ")}
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
