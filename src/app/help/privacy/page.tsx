import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Privacy Policy — NCWU StyleHub",
  description: "How NCWU StyleHub collects, uses and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      subtitle="We collect the minimum needed to deliver your order — nothing more."
    >
      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">What we collect</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
          <li>• Account details: name, email address and a securely hashed password.</li>
          <li>• Order details: items purchased, delivery name, address and phone number.</li>
          <li>• Saved items and reviews you create while signed in.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">How we use it</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Your data is used only to process orders, send transactional email (order confirmations, shipping updates
          and password resets) and keep your account secure. We never sell your data.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">Security</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Passwords are stored as one-way hashes and are never readable — including by our staff. Password reset
          links are single-use and expire after 60 minutes. All API credentials stay on our servers and are never
          exposed to the browser.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">Your rights</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          You can request a copy of your data or ask us to delete your account at any time by emailing{" "}
          <a href="mailto:info@shop.ncwu.site" className="font-medium text-primary hover:underline">
            info@shop.ncwu.site
          </a>
          .
        </p>
      </section>
    </InfoPage>
  );
}
