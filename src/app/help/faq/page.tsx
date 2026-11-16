import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "FAQ — NCWU StyleHub",
  description: "Common questions about orders, sizing, payments and accounts.",
};

const FAQ = [
  {
    q: "How do I choose the right size?",
    a: "Open any product page — if the item has sizes you will see them listed under the price. Pick your size before adding to cart. Products without size options are one-size.",
  },
  {
    q: "Where can I find my tracking code?",
    a: "Every order gets a tracking code (for example NCWU-261115-A7K2P9) automatically. Find it in My Orders or on your account page, and copy it with one click.",
  },
  {
    q: "Can I change or cancel an order?",
    a: "Yes, while the status is still Pending. Contact us with your order number and we will update it for you.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "Alipay, WeChat Pay and cash on delivery. Choose your method at checkout.",
  },
  {
    q: "I forgot my password. What now?",
    a: "Use the Forgot password link on the sign-in page. We email you a secure reset link that expires in 60 minutes.",
  },
  {
    q: "Do you keep my saved items?",
    a: "Yes. Tap the heart on any product and it appears in Saved Items — you need an account so it follows you across devices.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Frequently Asked Questions" subtitle="Quick answers to the questions we hear most.">
      <div className="divide-y divide-gray-100">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-4 first:pt-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-brand-text">
              {item.q}
              <span className="text-lg text-gray-300 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
