import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  glass,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-outline-variant bg-surface-container",
        glass && "backdrop-blur-xl bg-surface-container/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1 p-4 pb-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xs font-semibold uppercase tracking-widest text-on-surface-variant", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-4 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </p>
      <p className="text-xl font-semibold text-on-surface mono">{value}</p>
      {(sub || trend) && (
        <div className="mt-1.5 flex items-center gap-2">
          {trend && (
            <span className={cn("text-xs font-medium", trend.positive ? "text-emerald-400" : "text-red-400")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
        </div>
      )}
    </Card>
  );
}
