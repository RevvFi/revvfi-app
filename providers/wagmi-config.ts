import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { localChain, WALLETCONNECT_PROJECT_ID } from "@/constants/chains";

export const wagmiConfig = createConfig({
  chains: [localChain, mainnet, sepolia],
  connectors: [
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "RevvFi Institutional" }),
    walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }),
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
