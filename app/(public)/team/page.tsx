import Image from "next/image";
import type { Metadata } from "next";
import { Github, Linkedin, Twitter } from "lucide-react";

export const metadata: Metadata = {
  title: "Team | RevvFi",
  description: "Meet the team behind RevvFi.",
};

const TEAM = [
  {
    name: "Preet Singh",
    role: "Founder",
    photo: "/team/preetsingh.jpeg",
    bio:
      "Smart contract engineer specializing in secure, scalable decentralized systems across EVM and Cosmos ecosystems. Currently a Smart Contract Engineer at iTechnolabs, working on tokenized financial systems with role-based access control and extensive test coverage. Previously a full-stack blockchain engineer at Ungate.io, building wallet infrastructure and transaction authorization for multi-chain EVM networks, and a Web3 security researcher who identified vulnerabilities across DeFi protocols via Code4rena, Cantina, and Sherlock. Builder of RevvFi, Vesper Interchain (a Cosmos SDK chain bridging IBC collateral into EVM DeFi), and TokenMaker.",
    links: [
      { label: "Portfolio", href: "https://www.preetsingh.tech/", Icon: null },
      { label: "GitHub", href: "https://github.com/preetsinghmakkar", Icon: Github },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/preet-singh-a65967302/", Icon: Linkedin },
      { label: "Twitter", href: "https://twitter.com/RaOne_0xDev", Icon: Twitter },
    ],
  },
  {
    name: "Anitesh Kumar",
    role: "Co-Founder",
    photo: "/team/ani.jpeg",
    bio:
      "Full-stack developer and backend blockchain engineer, working primarily in Go. Anitesh is a core contributor to RevvFi's protocol and infrastructure, and drives DevOps and deployments across the stack — from local development environments through to testnet rollouts.",
    links: [
      { label: "GitHub", href: "https://github.com/KakshiDEV56", Icon: Github },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/anitesh-kumar-94035b312/", Icon: Linkedin },
    ],
  },
];

export default function TeamPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Team</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">The people behind RevvFi</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {TEAM.map((person) => (
          <div key={person.name} className="rounded-md border border-outline-variant/20 bg-surface-container p-6">
            <div className="flex items-center gap-4">
              <Image
                src={person.photo}
                alt={person.name}
                width={72}
                height={72}
                className="rounded-full object-cover shrink-0"
              />
              <div>
                <h2 className="text-lg font-semibold">{person.name}</h2>
                <p className="text-sm text-primary">{person.role}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed mt-4">{person.bio}</p>
            <div className="flex items-center gap-3 mt-4">
              {person.links.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                  {label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
