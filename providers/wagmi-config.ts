import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { localChain } from "@/constants/chains";

export const wagmiConfig = createConfig({
  chains: [localChain, mainnet, sepolia],
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
  transports: {
    [localChain.id]: http("http://127.0.0.1:8545"),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
