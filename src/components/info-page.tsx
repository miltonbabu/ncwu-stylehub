import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>
      <h1 className="mt-5 font-heading text-3xl font-bold text-brand-text sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      <div className="mt-8 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-xs text-gray-400">
        Questions? Email{" "}
        <a href="mailto:info@shop.ncwu.site" className="font-medium text-primary hover:underline">
          info@shop.ncwu.site
        </a>{" "}
        and our team will reply within one business day.
      </p>
    </main>
  );
}
