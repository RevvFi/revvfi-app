import { Droplets, ArrowUpRight } from "lucide-react";
import { FAUCET_URL } from "@/constants/links";

export function TestnetFaucetBanner() {
  return (
    <a
      href={FAUCET_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-primary-container/30 bg-primary-container/5 px-4 py-2.5 text-sm hover:bg-primary-container/10 transition-colors"
    >
      <Droplets className="h-4 w-4 text-primary shrink-0" />
      <span className="text-on-surface-variant">
        Need test tokens? <span className="text-primary font-medium">Get free mock USDC and WETH from the faucet</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 text-on-surface-variant/50 shrink-0 ml-auto" />
    </a>
  );
}
