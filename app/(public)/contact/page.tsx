import type { Metadata } from "next";
import { Mail, Linkedin, Github, Twitter } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact | RevvFi",
  description: "Get in touch with the RevvFi team.",
};

const CHANNELS = [
  { label: "Email", value: "preetsinghmakkar154@gmail.com", href: "mailto:preetsinghmakkar154@gmail.com", Icon: Mail },
  { label: "LinkedIn", value: "linkedin.com/in/preet-singh-a65967302", href: "https://www.linkedin.com/in/preet-singh-a65967302/", Icon: Linkedin },
  { label: "GitHub", value: "github.com/preetsinghmakkar", href: "https://github.com/preetsinghmakkar", Icon: Github },
  { label: "Twitter", value: "@RaOne_0xDev", href: "https://twitter.com/RaOne_0xDev", Icon: Twitter },
];

export default function ContactPage() {
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Contact</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">Get in touch</h1>
        <p className="text-base text-on-surface-variant mt-4">
          Questions about the protocol, a partnership inquiry, or found a bug? Reach out through any of the channels
          below.
        </p>
      </div>

      <div className="space-y-4">
        {CHANNELS.map(({ label, value, href, Icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-md border border-outline-variant/20 bg-surface-container p-4 hover:bg-surface-container-high transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">{label}</p>
              <p className="text-sm font-medium text-on-surface">{value}</p>
            </div>
          </a>
        ))}
      </div>

      <p className="text-xs text-on-surface-variant">
        For security disclosures, please email us directly rather than posting publicly.
      </p>
    </div>
  );
}
