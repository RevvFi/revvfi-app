import { createConfig, http } from "wagmi";
import type { Chain } from "viem";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { localChain } from "@/constants/chains";

// Avoid registering the same chain id twice if localChain is set to mainnet/sepolia.
const extraChains = [mainnet, sepolia].filter((c) => c.id !== localChain.id);
const chains = [localChain, ...extraChains] as [Chain, ...Chain[]];

const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

// batch: true coalesces multiple concurrent RPC requests fired within the
// same tick (e.g. a market card's several useReadContract calls) into one
// JSON-RPC batch over a single HTTP POST - pure round-trip reduction, no
// on-chain dependency (unlike multicall), each request still resolves/rejects
// independently.
function transportFor(chain: Chain) {
  if (chain.id === localChain.id) return http(localChain.rpcUrls.default.http[0], { batch: true });
  if (chain.id === mainnet.id) return http(mainnetRpcUrl, { batch: true });
  if (chain.id === sepolia.id) return http(sepoliaRpcUrl, { batch: true });
  return http(undefined, { batch: true });
}

const transports = Object.fromEntries(chains.map((c) => [c.id, transportFor(c)])) as Record<
  (typeof chains)[number]["id"],
  ReturnType<typeof http>
>;

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "RevvFi Institutional" }),
    injected({
      target() {
        type WindowWithPhantom = Window & { phantom?: { ethereum?: Parameters<typeof injected>[0] extends undefined ? never : unknown } };
        const provider = typeof window !== "undefined"
          ? (window as WindowWithPhantom).phantom?.ethereum
          : undefined;
        return {
          id: "phantom",
          name: "Phantom",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          provider: provider as any,
        };
      },
    }),
  ],
  transports,
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
