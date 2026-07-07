import { mainnet, sepolia } from "wagmi/chains";
import type { Chain } from "viem";

export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  31337: "Local Dev",
};

const KNOWN_BLOCK_EXPLORERS: Record<number, { name: string; url: string }> = {
  1: { name: "Etherscan", url: "https://etherscan.io" },
  11155111: { name: "Sepolia Etherscan", url: "https://sepolia.etherscan.io" },
};

// Active chain, driven by env vars (defaults to local Anvil).
const activeChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
const activeRpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ?? process.env.NEXT_PUBLIC_LOCAL_RPC_URL ?? "http://127.0.0.1:8545";

export const localChain: Chain = {
  id: activeChainId,
  name: CHAIN_NAMES[activeChainId] ?? `Chain ${activeChainId}`,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [activeRpcUrl] },
  },
  blockExplorers: KNOWN_BLOCK_EXPLORERS[activeChainId]
    ? { default: KNOWN_BLOCK_EXPLORERS[activeChainId] }
    : undefined,
  testnet: activeChainId !== 1,
};

export const supportedChains = [mainnet, sepolia, localChain] as const;

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
