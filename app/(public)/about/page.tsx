import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About | RevvFi",
  description: "RevvFi is a fixed-rate institutional lending protocol with isolated markets and on-chain reputation.",
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">About</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">Institutional-grade lending, on-chain</h1>
        <p className="text-base text-on-surface-variant mt-4 max-w-2xl">
          RevvFi is a fixed-rate lending protocol built for isolated, per-market credit relationships. Every market
          pairs one borrower with lenders who set their own rate and seniority, backed by real collateral and priced
          by Chainlink oracles — no pooled risk, no blended rates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Isolated Markets</h2>
          <p className="text-sm text-on-surface-variant">
            Each market is its own contract with its own collateral, borrower, and lenders — risk in one market never
            spills into another.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Fixed Rates, By Design</h2>
          <p className="text-sm text-on-surface-variant">
            Lenders quote their own APR when submitting an offer. Each position accrues interest independently at the
            rate it was quoted — no shared, blended pool rate.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-2">On-Chain Reputation</h2>
          <p className="text-sm text-on-surface-variant">
            Borrower repayment history is tracked on-chain, building a portable credit reputation that follows the
            wallet across markets.
          </p>
        </div>
      </div>

      <div className="border-t border-outline-variant/20 pt-8">
        <h2 className="text-xl font-semibold mb-3">Why we built this</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          Most on-chain lending pools blend every lender into one shared rate, regardless of what they actually
          agreed to. We wanted something closer to how institutional credit actually works — bilateral terms, real
          collateral, and a rate you can actually rely on. RevvFi is our attempt at that, built and audited in the
          open.
        </p>
        <Link href="/team" className="inline-block mt-4 text-sm text-primary hover:underline">
          Meet the team →
        </Link>
      </div>

      <a
        href="https://docs.revvfi.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 rounded-md border border-outline-variant/20 bg-surface-container p-6 hover:bg-surface-container-high transition-colors group"
      >
        <div className="h-12 w-12 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-on-surface">Explore the RevvFi Documentation</p>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Contract architecture, matching and liquidation mechanics, reputation scoring, and the full event/gas
            reference — docs.revvfi.xyz
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-on-surface-variant/50 group-hover:text-primary transition-colors shrink-0" />
      </a>
    </div>
  );
}
