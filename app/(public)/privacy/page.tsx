import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | RevvFi",
  description: "Privacy Policy for the RevvFi protocol.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-on-surface-variant mt-2">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-on-surface-variant">
        This is a template Privacy Policy for a testnet/early-stage DeFi protocol, not legal advice. It should be
        reviewed by qualified legal counsel before any mainnet or production launch, especially regarding
        jurisdiction-specific data protection requirements (e.g. GDPR, CCPA).
      </div>

      <div className="space-y-6 text-sm text-on-surface-variant leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">1. What We Collect</h2>
          <p>When you use RevvFi, we (or our infrastructure providers) may collect:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Your public wallet address and on-chain transaction activity (inherently public on the blockchain).</li>
            <li>Basic request metadata (IP address, browser/device type) for security and rate-limiting purposes.</li>
            <li>Anything you voluntarily provide, e.g. via a contact channel.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">2. What We Don't Collect</h2>
          <p>
            We never have access to your private keys or seed phrase. RevvFi is non-custodial — we cannot access,
            move, or freeze your funds. We do not collect government-issued ID, KYC documents, or similar unless a
            specific regulatory requirement makes that necessary in the future.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">3. Cookies &amp; Local Storage</h2>
          <p>
            The interface may use browser local storage to remember preferences (such as your theme choice) and a
            session token after you sign in with your wallet (Sign-In With Ethereum). We do not use third-party
            advertising trackers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">4. Third-Party Services</h2>
          <p>
            Connecting your wallet may involve third-party services such as MetaMask, WalletConnect, Coinbase
            Wallet, or RPC providers — each governed by their own privacy policy. Blockchain data itself (addresses,
            transactions, balances) is public and permanent by design, independent of anything we do.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">5. Data Retention</h2>
          <p>
            We retain off-chain data (such as indexed protocol events) only as long as needed to operate the
            interface and backend. On-chain data is immutable and outside our control.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">6. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access, correct, or request deletion of personal
            data we hold about you (excluding immutable on-chain data, which cannot be altered or deleted). Contact
            us via the channels on our <a href="/contact" className="text-primary hover:underline">Contact page</a>{" "}
            to make a request.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected by updating the
            "Last updated" date above.
          </p>
        </section>
      </div>
    </div>
  );
}
