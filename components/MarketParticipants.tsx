"use client";

import { useState } from "react";
import { usePositions } from "@/hooks/usePositions";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatAPR, formatTokenAmount } from "@/lib/utils";
import { Copy, Check, Users } from "lucide-react";
import type { Position } from "@/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="h-5 w-5 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
      title="Copy address"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function ParticipantCard({ position, borrowDecimals, borrowSymbol }: { position: Position; borrowDecimals?: number; borrowSymbol?: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="font-mono text-sm text-on-surface truncate">
            {formatAddress(position.lender)}
          </span>
          <CopyButton text={position.lender} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-on-surface-variant mb-0.5">Principal</p>
            <p className="font-semibold text-on-surface mono">
              {formatTokenAmount(position.principal, borrowDecimals)} {borrowSymbol}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant mb-0.5">APR</p>
            <p className="font-semibold text-primary">{formatAPR(position.apr)}</p>
          </div>
          <div>
            <p className="text-on-surface-variant mb-0.5">Seniority</p>
            <p className="font-semibold text-on-surface">
              {position.seniority === 0 ? "Senior" : "Junior"}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant mb-0.5">Position</p>
            <p className="font-semibold text-on-surface">#{position.token_id}</p>
          </div>
        </div>
      </div>
      <StatusBadge status={position.status} />
    </div>
  );
}

export function MarketParticipants({ marketAddress, borrowDecimals, borrowSymbol }: { marketAddress: string; borrowDecimals?: number; borrowSymbol?: string }) {
  const { data, isLoading, isError } = usePositions({ market_address: marketAddress });

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-on-surface-variant" />
          <p className="text-sm font-semibold text-on-surface">Market Participants</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </Card>
    );
  }

  const positions = data?.positions ?? [];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-on-surface-variant" />
        <p className="text-sm font-semibold text-on-surface">Market Participants</p>
        {positions.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded bg-white/5 text-xs text-on-surface-variant">
            {positions.length} {positions.length === 1 ? "lender" : "lenders"}
          </span>
        )}
      </div>

      {isError ? (
        <p className="text-sm text-on-surface-variant py-4 text-center">
          Connect your wallet to view participants
        </p>
      ) : positions.length === 0 ? (
        <div className="py-8 text-center">
          <Users className="h-8 w-8 text-on-surface-variant/30 mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">No lenders yet</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">
            Be the first to supply liquidity
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => (
            <ParticipantCard key={position.token_id} position={position} borrowDecimals={borrowDecimals} borrowSymbol={borrowSymbol} />
          ))}
        </div>
      )}
    </Card>
  );
}
