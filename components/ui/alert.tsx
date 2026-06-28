import { cn } from "@/lib/utils";

export function Alert({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-outline-variant/20 bg-surface-container/50 p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AlertTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm font-semibold text-on-surface mb-1", className)}>{children}</p>
  );
}

export function AlertDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-on-surface-variant", className)}>{children}</p>
  );
}
