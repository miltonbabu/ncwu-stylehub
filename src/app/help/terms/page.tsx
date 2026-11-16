import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Terms of Service — NCWU StyleHub",
  description: "The terms that apply when you shop at NCWU StyleHub.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      subtitle="The rules that apply when you browse or buy from NCWU StyleHub."
    >
      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">1. Your account</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          You are responsible for keeping your password private and for all activity on your account. Passwords are
          stored as one-way hashes on our servers — we never see them in plain text.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">2. Orders and pricing</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
          <li>• All prices are shown in CNY (¥) and include applicable taxes.</li>
          <li>• An order is confirmed once we send the confirmation email with your tracking code.</li>
          <li>• You may cancel an order yourself while it is still <strong>pending</strong> or <strong>paid</strong>, before it ships.</li>
          <li>• If an item is out of stock after you order, we will contact you and refund the affected amount.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">3. Payment</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          We accept Alipay, WeChat Pay and cash on delivery. This store is a course project; payments are simulated
          for demonstration purposes and no real charge is made.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">4. Delivery and returns</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Delivery and return rules are listed on our{" "}
          <a href="/help/shipping-returns" className="font-medium text-primary hover:underline">
            Shipping &amp; Returns
          </a>{" "}
          page and form part of these terms.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">5. Acceptable use</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Do not attempt to disrupt the store, scrape it at scale, or use it to distribute unlawful content. Reviews
          must be honest and relate to a product you purchased.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">6. Changes</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          We may update these terms as the store evolves. The version published here at the time of your purchase
          applies to that order.
        </p>
      </section>
    </InfoPage>
  );
}
