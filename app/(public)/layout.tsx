import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";
import { GITHUB_ORG_URL } from "@/constants/links";

const LEGAL_LINKS = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/support", label: "Support" },
  { href: "/contribute", label: "Contribute" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <header className="border-b border-outline-variant/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/favicon-96x96.png" alt="RevvFi" width={28} height={28} className="rounded" />
            <span className="text-base font-semibold">RevvFi</span>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href={GITHUB_ORG_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="RevvFi on GitHub"
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <Link
              href="/dashboard"
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Go to App →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">{children}</div>
      </main>

      <footer className="border-t border-outline-variant/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant">© {new Date().getFullYear()} RevvFi. All rights reserved.</p>
          <nav className="flex items-center gap-5">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
