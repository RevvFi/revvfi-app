import { mainnet, sepolia } from "wagmi/chains";
import type { Chain } from "viem";

export const localChain: Chain = {
  id: 31337,
  name: "Local Development",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_LOCAL_RPC_URL ?? "http://127.0.0.1:8545"] },
  },
  blockExplorers: undefined,
  testnet: true,
};

export const supportedChains = [mainnet, sepolia, localChain] as const;

export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  31337: "Local Dev",
};

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
