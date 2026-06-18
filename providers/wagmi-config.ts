import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { localChain, WALLETCONNECT_PROJECT_ID } from "@/constants/chains";

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, localChain],
  connectors: [
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "RevvFi Institutional" }),
    walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [localChain.id]: http(process.env.NEXT_PUBLIC_LOCAL_RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
