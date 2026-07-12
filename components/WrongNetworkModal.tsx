"use client";

import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { localChain, CHAIN_NAMES } from "@/constants/chains";
import { FAUCET_URL } from "@/constants/links";

export function WrongNetworkModal() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [dismissed, setDismissed] = useState(false);

  const isWrongNetwork = isConnected && chain !== undefined && chain.id !== localChain.id;

  // Re-prompt if the wallet moves to yet another (still wrong) network.
  useEffect(() => {
    setDismissed(false);
  }, [chain?.id]);

  const connectedChainName = chain ? CHAIN_NAMES[chain.id] ?? `Chain ${chain.id}` : "an unsupported network";

  return (
    <Dialog open={isWrongNetwork && !dismissed} onOpenChange={(open) => !open && setDismissed(true)}>
      <DialogContent
        title="Wrong network"
        description={`RevvFi is in active development and currently only live on ${localChain.name}. Your wallet is connected to ${connectedChainName}.`}
      >
        <div className="p-6 pt-4 space-y-4">
          <p className="text-sm text-on-surface-variant">
            No mainnet market is live yet — an audit hasn&apos;t been completed. Switch to {localChain.name} to
            try borrowing, lending, and liquidation with free test tokens.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => switchChain({ chainId: localChain.id })}
              disabled={isPending}
              className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #FF8C47 0%, #FF6A00 50%, #E55F00 100%)",
                boxShadow: "0 4px 24px rgba(255,106,0,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
              }}
            >
              {isPending ? "Switching…" : `Switch to ${localChain.name}`}
            </button>
            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 flex items-center justify-center rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:border-outline transition-colors"
            >
              Get {localChain.name} Test Tokens
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
