"use client";

import Image from "next/image";
import { useAccount, useConnect } from "wagmi";
import { markExplicitConnectIntent } from "@/lib/connect-intent";

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
  const { connect, connectors, isPending } = useConnect();

  const injected = connectors.find((c) => c.name.toLowerCase().includes("metamask") || c.type === "injected");
  const first = injected ?? connectors[0];

  // Sign-in (SIWE) is triggered centrally by AuthWalletSync, gated on the
  // explicit-connect-intent flag marked here - this component unmounts
  // itself the instant isConnected flips true (WalletGate swaps to
  // rendering its children), so a local onSuccess callback here would never
  // reliably fire.
  function handleConnect() {
    if (!first) return;
    markExplicitConnectIntent();
    connect({ connector: first });
  }

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
        onClick={handleConnect}
        disabled={isPending || !first}
        className="relative h-12 px-10 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #FF8C47 0%, #FF6A00 50%, #E55F00 100%)",
          boxShadow: "0 4px 24px rgba(255,106,0,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>

      {/* Subtle hint */}
      <p className="mt-4 text-[11px] text-on-surface-variant/60">
        MetaMask · Coinbase · WalletConnect
      </p>
    </div>
  );
}
