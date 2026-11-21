import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { InfoPage } from "@/components/info-page";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us — NCWU StyleHub",
  description: "How to reach the NCWU StyleHub team.",
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      subtitle="Questions about an order, a size or a return? We are here to help."
    >
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-text">
            <Mail className="h-4 w-4 text-primary" /> Email
          </p>
          <a href="mailto:info@shop.ncwu.site" className="mt-1 block text-sm text-primary hover:underline">
            info@shop.ncwu.site
          </a>
          <p className="mt-1 text-xs text-gray-500">Replies within one business day.</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-text">
            <Phone className="h-4 w-4 text-primary" /> Phone
          </p>
          <a href="tel:17513257179" className="mt-1 block text-sm text-primary hover:underline">17513257179</a>
          <p className="mt-1 text-xs text-gray-500">Mon–Sat, 9:00–18:00 (China Standard Time).</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-text">
            <MapPin className="h-4 w-4 text-primary" /> Store
          </p>
          <p className="mt-1 text-sm text-gray-600">NCWU Business Street, F1 2nd Floor, Zhengzhou, Henan, China</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-text">
            <Clock className="h-4 w-4 text-primary" /> Response time
          </p>
          <p className="mt-1 text-sm text-gray-600">Most emails answered the same day.</p>
        </div>
      </section>

      <section className="border-t border-gray-100 pt-6">
        <ContactForm />
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-brand-text">Before you write</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
          <li>
            • For order questions, include your order number and the tracking code shown in{" "}
            <Link href="/orders" className="font-medium text-primary hover:underline">
              My Orders
            </Link>
            .
          </li>
          <li>
            • Sizing help and common questions are answered on the{" "}
            <a href="/help/faq" className="font-medium text-primary hover:underline">
              FAQ
            </a>{" "}
            page.
          </li>
          <li>• You can cancel an unshipped order yourself from the order detail page.</li>
        </ul>
      </section>
    </InfoPage>
  );
}
