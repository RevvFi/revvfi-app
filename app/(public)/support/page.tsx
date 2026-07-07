import Link from "next/link";
import type { Metadata } from "next";
import { HeartHandshake, ShieldCheck, Rocket, Users, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Support RevvFi",
  description: "Sponsor, fund, or partner with RevvFi to help take the protocol from testnet to a secure, audited mainnet launch.",
};

const USES = [
  {
    Icon: ShieldCheck,
    title: "Security Audits",
    desc: "Independent smart-contract audits before any mainnet deployment — non-negotiable for a lending protocol handling real collateral.",
  },
  {
    Icon: Rocket,
    title: "Mainnet Launch",
    desc: "Deployment costs, initial liquidity incentives, and infrastructure to go from testnet to a live, production network.",
  },
  {
    Icon: Users,
    title: "Team Growth",
    desc: "Bringing on additional engineering and security help to ship faster without cutting corners.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Support RevvFi</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">Help us take RevvFi to mainnet</h1>
        <p className="text-base text-on-surface-variant mt-4 max-w-2xl">
          RevvFi is live on testnet today, built and maintained by a small team. If you're interested in sponsoring,
          funding, or partnering with the protocol — whether that's a grant, an investment conversation, or just
          wanting to see this succeed — we'd like to hear from you.
        </p>
      </div>

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
