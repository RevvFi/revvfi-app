import Link from "next/link";
import type { Metadata } from "next";
import { HeartHandshake, ShieldCheck, Users, Rocket, TrendingUp, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Invest in RevvFi",
  description: "RevvFi is launching on mainnet. Talk to us about investing, or help fund security audits, maintenance, and v2 development.",
};

const USES = [
  {
    Icon: ShieldCheck,
    title: "Security Audits",
    desc: "Independent smart-contract audits are ongoing and non-negotiable for a lending protocol handling real collateral — this is where funding matters most right now.",
  },
  {
    Icon: Users,
    title: "Maintenance & Operations",
    desc: "Infrastructure, monitoring, and the ongoing engineering time it takes to keep a live protocol running safely and reliably.",
  },
  {
    Icon: Rocket,
    title: "Growth & v2",
    desc: "Taking RevvFi mainstream — integrations, partnerships, and building out v2 — beyond what a small team can self-fund.",
  },
];

export default function InvestPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Invest & Support</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">Back RevvFi's next chapter</h1>
        <p className="text-base text-on-surface-variant mt-4 max-w-2xl">
          RevvFi is launching on mainnet — self-funded and built by a small team. The deployment itself is covered.
          What comes after is where we'd like help: independent security audits, ongoing maintenance, and taking
          the protocol mainstream with a v2.
        </p>
      </div>

      {/* Investors */}
      <div className="border border-outline-variant/20 bg-surface-container rounded-md p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Investors</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
              If you're a fund, angel, or ecosystem investor and want to talk about backing RevvFi directly, we're
              open to that conversation. Nothing here is an offer or solicitation of securities — just an invitation
              to talk. Terms, if any, get worked out privately.
            </p>
          </div>
        </div>
      </div>

      {/* Grants / sponsorship */}
      <div>
        <h2 className="text-xl font-semibold mb-4">What sponsorship funds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {USES.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-md border border-outline-variant/20 bg-surface-container p-5">
              <div className="h-9 w-9 rounded-full bg-primary-container/10 flex items-center justify-center mb-3">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-on-surface mb-1">{title}</h2>
              <p className="text-sm text-on-surface-variant">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant/20 pt-8">
        <div className="flex items-start gap-3">
          <HeartHandshake className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Also open to</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
              Partnership conversations, ecosystem grants, and hiring us for related engineering or blockchain
              development work. If any of this is you, the easiest next step is to reach out directly — see who
              you'd be talking to on our <Link href="/team" className="text-primary hover:underline">Team page</Link>,
              then get in touch.
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/contact"
        className="flex items-center gap-4 rounded-md border border-outline-variant/20 bg-surface-container p-6 hover:bg-surface-container-high transition-colors group max-w-2xl"
      >
        <div className="flex-1">
          <p className="text-base font-semibold text-on-surface">Get in touch</p>
          <p className="text-sm text-on-surface-variant mt-0.5">Email, LinkedIn, GitHub, and Twitter — all on the Contact page.</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-on-surface-variant/50 group-hover:text-primary transition-colors shrink-0" />
      </Link>
    </div>
  );
}
