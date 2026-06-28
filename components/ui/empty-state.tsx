import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryLabel,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="rounded-full bg-surface-container-low p-6 mb-4">
        <Icon className="h-10 w-10 text-on-surface-variant/50" />
      </div>
      <h3 className="text-base font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm mb-6">{description}</p>
      {action && (
        <div className="flex gap-3">
          <Button onClick={action}>{actionLabel ?? "Get Started"}</Button>
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction}>
              {secondaryLabel ?? "Learn More"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
