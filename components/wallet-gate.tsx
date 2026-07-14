"use client";

import { useState } from "react";
import Image from "next/image";
import { Github } from "lucide-react";
import { useAccount } from "wagmi";
import { WalletPickerDialog } from "@/components/wallet/WalletPickerDialog";
import { GITHUB_ORG_URL, LANDING_URL, FAUCET_URL } from "@/constants/links";

const LEGAL_LINKS = [
  { href: LANDING_URL, label: "About" },
  { href: `${LANDING_URL}/team`, label: "Team" },
  { href: `${LANDING_URL}/invest`, label: "Invest" },
  { href: `${LANDING_URL}/contribute`, label: "Contribute" },
  { href: FAUCET_URL, label: "Faucet" },
  { href: `${LANDING_URL}/contact`, label: "Contact" },
  { href: `${LANDING_URL}/terms`, label: "Terms" },
  { href: `${LANDING_URL}/privacy`, label: "Privacy" },
];

interface WalletGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** If true, renders full-page centered layout; if false, fits inside a content area */
  fullPage?: boolean;
}

export function WalletGate({
  children,
  title = "Connect your wallet",
  description = "Connect your wallet to access your positions, borrowing activity, and personalised data.",
  fullPage = true,
}: WalletGateProps) {
  const { isConnected } = useAccount();

  if (isConnected) return <>{children}</>;

  return <WalletPrompt title={title} description={description} fullPage={fullPage} />;
}

export function WalletPrompt({
  title = "Connect your wallet",
  description = "Connect your wallet to access your positions, borrowing activity, and personalised data.",
  fullPage = true,
}: {
  title?: string;
  description?: string;
  fullPage?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${
        fullPage ? "min-h-[calc(100vh-4rem)]" : "py-20"
      }`}
    >
      {/* Ghost illustration */}
      <div className="animate-float mb-6">
        <Image
          src="/ghost.svg"
          alt="Connect wallet"
          width={160}
          height={160}
          className="select-none ghost-float"
          priority
          draggable={false}
        />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-on-surface mb-3 max-w-xs leading-tight">
        {title}
      </h2>

      {/* Description */}
      <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed mb-8">
        {description}
      </p>

      {/* CTA */}
      <button
        onClick={() => setPickerOpen(true)}
        className="relative h-12 px-10 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #FF8C47 0%, #FF6A00 50%, #E55F00 100%)",
          boxShadow: "0 4px 24px rgba(255,106,0,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      >
        Connect Wallet
      </button>

      <WalletPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />

      {/* Subtle hint */}
      <p className="mt-4 text-[11px] text-on-surface-variant/60">
        MetaMask · Coinbase · Phantom · any injected browser wallet
      </p>

      {/* GitHub */}
      <a
        href={GITHUB_ORG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center gap-2 rounded-full border border-outline-variant/40 px-4 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:border-outline-variant transition-colors"
      >
        <Github className="h-3.5 w-3.5" />
        View on GitHub
      </a>

      {/* Company links */}
      <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {LEGAL_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
