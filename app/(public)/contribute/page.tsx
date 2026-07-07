import Link from "next/link";
import type { Metadata } from "next";
import { Github, ArrowUpRight, GitPullRequest, Bug, FileText, Shield } from "lucide-react";
import { GITHUB_ORG_URL, GITHUB_REPOS } from "@/constants/links";

export const metadata: Metadata = {
  title: "Contribute | RevvFi",
  description: "How to contribute to the RevvFi protocol — code, docs, and bug reports.",
};

const REPOS = [
  { name: "revvfi-contracts", desc: "Solidity smart contracts (Foundry)", href: GITHUB_REPOS.contracts },
  { name: "revvfi-backend", desc: "Go indexer and API", href: GITHUB_REPOS.backend },
  { name: "revvfi-app", desc: "Next.js frontend", href: GITHUB_REPOS.app },
  { name: "revvfi-docs", desc: "Technical documentation", href: GITHUB_REPOS.docs },
];

export default function ContributePage() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Contribute</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">Contribute to RevvFi</h1>
        <p className="text-base text-on-surface-variant mt-4">
          RevvFi is open source across all four repositories — contracts, backend, frontend, and docs. Code
          contributions, bug reports, and documentation fixes are all welcome.
        </p>
      </div>

      <a
        href={GITHUB_ORG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 rounded-md border border-outline-variant/20 bg-surface-container p-5 hover:bg-surface-container-high transition-colors group"
      >
        <div className="h-11 w-11 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
          <Github className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-on-surface">github.com/RevvFi</p>
          <p className="text-sm text-on-surface-variant mt-0.5">All four repositories, issues, and pull requests</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-on-surface-variant/50 group-hover:text-primary transition-colors shrink-0" />
      </a>

      <div>
        <h2 className="text-lg font-semibold text-on-surface mb-3">Repositories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPOS.map((r) => (
            <a
              key={r.name}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-outline-variant/20 bg-surface-container p-4 hover:bg-surface-container-high transition-colors"
            >
              <p className="text-sm font-mono font-medium text-on-surface">{r.name}</p>
              <p className="text-xs text-on-surface-variant mt-1">{r.desc}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-6 text-sm text-on-surface-variant leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2 flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-primary" /> How to Submit a Change
          </h2>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Fork the relevant repository and create a branch off <code className="text-xs">main</code>.</li>
            <li>Make your change. Keep pull requests focused on one thing — smaller PRs get reviewed faster.</li>
            <li>
              Run the test suite before opening a PR: <code className="text-xs">forge test</code> for contracts,{" "}
              <code className="text-xs">go build ./... &amp;&amp; go vet ./... &amp;&amp; go test ./...</code> for the
              backend, <code className="text-xs">npx tsc --noEmit</code> for the frontend.
            </li>
            <li>Open a pull request against <code className="text-xs">main</code> with a clear description of what changed and why.</li>
            <li>Be responsive to review feedback — most PRs need at least one round of changes.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Code Standards
          </h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Match the existing style and conventions of the file/repo you're editing rather than introducing a new pattern.</li>
            <li>No hardcoded addresses, private keys, or magic numbers where an existing config/env pattern already exists.</li>
            <li>Comments should explain non-obvious "why," not restate what the code already says.</li>
            <li>Contract changes should come with tests covering the new behavior, not just the happy path.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2 flex items-center gap-2">
            <Bug className="h-4 w-4 text-primary" /> Reporting Bugs
          </h2>
          <p>
            Open an issue on the relevant repository with steps to reproduce, what you expected, and what actually
            happened. For smart contract bugs, include the affected function and, if possible, a minimal Foundry
            test that reproduces the issue.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security Issues
          </h2>
          <p>
            Do not open a public issue for a security vulnerability. See our{" "}
            <Link href="/contact" className="text-primary hover:underline">Contact page</Link> and reach out
            directly instead.
          </p>
        </section>
      </div>
    </div>
  );
}
