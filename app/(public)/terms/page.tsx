import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | RevvFi",
  description: "Terms of Service for the RevvFi protocol.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">Terms of Service</h1>
        <p className="text-sm text-on-surface-variant mt-2">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-on-surface-variant">
        This is a template Terms of Service for a testnet/early-stage DeFi protocol, not legal advice. It should be
        reviewed by qualified legal counsel before any mainnet or production launch.
      </div>

      <div className="space-y-6 text-sm text-on-surface-variant leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the RevvFi protocol, website, or interface (collectively, the "Protocol"), you
            agree to be bound by these Terms of Service. If you do not agree, do not use the Protocol.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">2. Nature of the Protocol</h2>
          <p>
            RevvFi is a non-custodial, decentralized lending protocol implemented as a set of immutable smart
            contracts deployed on public blockchains. RevvFi does not custody user funds, hold private keys, or act
            as an intermediary to any transaction. All transactions occur directly between your wallet and the smart
            contracts; we do not have the ability to reverse, freeze, or otherwise control transactions once
            submitted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">3. No Warranty, As-Is Basis</h2>
          <p>
            The Protocol is provided "as is" and "as available," without warranties of any kind, express or implied,
            including but not limited to warranties of merchantability, fitness for a particular purpose, or
            non-infringement. Smart contracts may contain bugs or vulnerabilities. Use of the Protocol is entirely at
            your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">4. No Guarantee of Returns</h2>
          <p>
            Nothing on this site or in the Protocol constitutes financial, investment, tax, or legal advice.
            Interest rates, collateral values, and market conditions can change. Lending and borrowing through DeFi
            protocols carries risk of loss, including total loss of deposited assets, due to smart contract risk,
            oracle failure, liquidation, or market volatility.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">5. User Responsibility</h2>
          <p>
            You are solely responsible for the security of your wallet, private keys, and seed phrases. We will
            never ask for your private key or seed phrase. You are responsible for evaluating the risks of any
            market, offer, or position before interacting with it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">6. Eligibility</h2>
          <p>
            You represent that you are not a resident of, or located in, any jurisdiction where use of the Protocol
            would be illegal or restricted, and that you are legally permitted to use decentralized financial
            protocols under the laws applicable to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, RevvFi and its contributors shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of funds, arising from
            your use of the Protocol.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">8. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Protocol after changes are posted
            constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">9. Governing Law</h2>
          <p>
            [Governing law and jurisdiction to be determined by legal counsel prior to production launch.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-on-surface mb-2">10. Contact</h2>
          <p>
            Questions about these Terms can be directed to us via the channels listed on our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
