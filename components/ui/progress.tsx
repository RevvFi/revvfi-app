import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
  max = 100,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
  max?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <ProgressPrimitive.Root
      value={value}
      max={max}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/30", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-full bg-primary-container transition-all duration-500", indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
