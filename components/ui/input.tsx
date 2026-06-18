import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ className, label, error, hint, suffix, prefix, type = "text", ref, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 text-on-surface-variant text-sm">{prefix}</div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "h-10 w-full rounded border border-outline-variant/50 bg-surface-container-low px-3 text-sm text-on-surface placeholder:text-on-surface-variant/50",
            "transition-colors focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            prefix && "pl-9",
            suffix && "pr-9",
            error && "border-error/60 focus:border-error focus:ring-error/20",
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 text-on-surface-variant text-sm">{suffix}</div>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function Textarea({ className, label, error, ref, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "min-h-20 w-full rounded border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50",
          "transition-colors focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30",
          "disabled:opacity-40 resize-y",
          error && "border-error/60",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
