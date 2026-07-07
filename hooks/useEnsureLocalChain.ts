"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { localChain } from "@/constants/chains";

/**
 * viem's writeContract throws ChainMismatchError if the wallet's currently
 * active network doesn't match the transaction's target chain — it does NOT
 * switch networks automatically, even when `chainId` is passed to
 * writeContractAsync. The caller has to explicitly request the switch first.
 *
 * Call this at the start of every mutationFn, before the first
 * writeContractAsync — it prompts MetaMask to switch to the local Anvil
 * chain if it isn't already there, then resolves. No-op if already correct.
 */
export function useEnsureLocalChain() {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  return async function ensureLocalChain() {
    if (chainId !== localChain.id) {
      await switchChainAsync({ chainId: localChain.id });
    }
  };
}
