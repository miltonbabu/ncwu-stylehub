"use client";

import { getSeasonalPromo } from "@/lib/seasonal";
import { subscribeToClub } from "@/lib/api";
import type { Category, Promotion } from "@/lib/types";
import { imgFallback, cloudinaryImg } from "@/lib/utils";
import { ArrowRight, BadgePercent, Headphones, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "./ui/badge";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow text-primary">Browse</p>
          <h2 className="mt-1.5 font-heading text-2xl font-bold text-brand-text sm:text-3xl">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/shop"
          className="link-underline hidden items-center gap-1.5 text-sm font-semibold text-primary sm:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="stagger-fade grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group flex flex-col items-center gap-3"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-brand-soft ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift">
              <img
                src={cloudinaryImg(cat.image_url, { width: 400, height: 400 })}
                alt={cat.name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = imgFallback(`cat-${cat.slug}`);
                }}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-text/35 via-brand-text/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="text-center">
              <p className="font-heading text-sm font-semibold text-brand-text transition-colors duration-200 group-hover:text-primary">
                {cat.name}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-gray-400 transition-colors group-hover:text-gray-600">{cat.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PromoSections({ promotions }: { promotions: Promotion[] }) {
  const seasonal = getSeasonalPromo();
  const main = promotions
    .filter((p) => p.position === "home-main")
    .slice(0, 2)
    .map((p, i) =>
      i === 0 ? { ...p, title: seasonal.title, subtitle: seasonal.subtitle, badge: seasonal.badge } : p,
    );
  const strip = promotions.find((p) => p.position === "home-strip");
  const stripTitle = strip ? strip.title.split("$80").join("¥80") : "";
  const stripSubtitle = strip ? strip.subtitle.split("$80").join("¥80") : "";

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {main.length > 0 && (
        <div className="stagger-fade grid gap-5 md:grid-cols-2 sm:gap-6">
          {main.map((promo) => (
            <Link
              key={promo.id}
              href={promo.link_url}
              className="group relative flex h-72 overflow-hidden rounded-[1.75rem] bg-brand-text shadow-soft ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <img
                src={cloudinaryImg(promo.image_url, { width: 900, height: 480 })}
                alt={promo.title}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = imgFallback(`promo-${promo.id}`);
                }}
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-1000 group-hover:scale-[1.06] group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-text/92 via-brand-text/60 to-brand-text/5 transition-opacity duration-300" />
              <div className="relative flex max-w-xs flex-col justify-center gap-3 p-8">
                {promo.badge && <Badge tone="accent" className="w-fit shadow-sm shadow-black/20">{promo.badge}</Badge>}
                <h3 className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">{promo.title}</h3>
                <p className="text-sm leading-relaxed text-white/75">{promo.subtitle}</p>
                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-text shadow-lg transition-all duration-300 group-hover:gap-2.5 group-hover:bg-primary group-hover:text-white group-hover:shadow-primary/40">
                  Shop the Sale <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {strip && (
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-brand-soft/70 via-white to-brand-soft/50 px-6 py-5 shadow-soft transition-all duration-300 hover:border-primary/40 hover:shadow-md sm:mt-6 sm:flex-row sm:px-8 sm:py-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/30">
              <BadgePercent className="h-6 w-6" />
            </span>
            <div>
              <p className="font-heading text-base font-bold text-brand-text sm:text-lg">{stripTitle}</p>
              <p className="text-sm text-brand-text/60">{stripSubtitle}</p>
            </div>
          </div>
          <Link
            href={strip.link_url}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/35 sm:w-auto"
          >
            {strip.badge ? `Claim ${strip.badge}` : "Learn More"}
          </Link>
        </div>
      )}
    </section>
  );
}

const TRUST = [
  { icon: Truck, title: "Free Shipping", desc: "On all orders over ¥80" },
  { icon: RefreshCcw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected checkout" },
  { icon: Headphones, title: "24/7 Support", desc: "Dedicated help center" },
];

export function TrustSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  const join = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await subscribeToClub(email.trim());
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Could not join the club — please try again.");
    }
  };

  return (
    <section className="border-t border-gray-100 bg-gradient-to-b from-white to-brand-soft/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="stagger-fade grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item.title} className="group flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-md group-hover:shadow-primary/25">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-heading text-sm font-bold text-brand-text">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-text via-brand-text to-brand-dark px-6 py-10 text-center shadow-lift ring-1 ring-black/10 sm:px-8 sm:py-12">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Join the NCWU StyleHub Club
          </h2>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-white/70">
            Subscribe for exclusive offers, early access to new drops and 10% off your first order.
          </p>
          {status === "done" ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white shadow-md ring-1 ring-white/20 backdrop-blur-sm">
              You&apos;re in! Check your inbox for your 10% welcome code.
            </p>
          ) : (
            <form onSubmit={join} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Email address"
                className="h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/45 focus:border-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-12 cursor-pointer rounded-full bg-accent px-7 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-accent/35 disabled:cursor-wait disabled:opacity-70"
              >
                {status === "loading" ? "Joining…" : "Subscribe"}
              </button>
            </form>
          )}
          {error && <p className="mt-3 text-xs font-medium text-red-200">{error}</p>}
        </div>
      </div>
    </section>
  );
}
