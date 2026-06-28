"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function CopyButton({ text, label, className, showLabel = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    if (label) toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded text-on-surface-variant hover:text-on-surface transition-colors shrink-0",
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {showLabel && <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>}
    </button>
  );
}
