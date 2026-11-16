import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Shipping & Returns — NCWU StyleHub",
  description: "Delivery times, shipping fees and our return policy.",
};

export default function ShippingReturnsPage() {
  return (
    <InfoPage
      title="Shipping & Returns"
      subtitle="Everything you need to know about getting your order and sending it back."
    >
      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">Delivery</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
          <li>• Orders are packed and dispatched within 1–2 business days.</li>
          <li>• Delivery normally takes 3–7 business days inside mainland China.</li>
          <li>• Shipping is <strong>free on orders over ¥80</strong>. Below that a flat ¥6.90 fee applies.</li>
          <li>• Every order receives a tracking code the moment it is placed, visible in My Orders.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">Tracking</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Open <span className="font-medium text-brand-text">My Orders</span> and press{" "}
          <span className="font-medium text-brand-text">Track order</span> to see the live status timeline and copy
          your tracking code.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">Returns</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
          <li>• You may return unworn items within 7 days of delivery.</li>
          <li>• Items must keep their original tags and packaging.</li>
          <li>• Contact us with your order number and we will arrange the pickup.</li>
          <li>• Refunds are issued to the original payment method within 3–5 business days of approval.</li>
        </ul>
      </section>
    </InfoPage>
  );
}
