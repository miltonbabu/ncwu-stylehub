"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, Mail, MapPin, Phone } from "lucide-react";
import { showComingSoon } from "@/components/coming-soon";
import { BrandLogo } from "@/components/brand-logo";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.2-1.5 1.5-1.5h1.5V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9V11H8v3h2.5v7h3z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.1 22H3l7.3-8.3L2 2h6.5l4.4 5.8L18.9 2zm-1.1 18h1.7L7.4 3.8H5.6L17.8 20z" />
    </svg>
  );
}

/** Alipay mark — the brand's blue tile with its 支 glyph. */
function AlipayMark() {
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1677ff] text-[13px] font-bold leading-none text-white"
    >
      支
    </span>
  );
}

/** WeChat Pay mark — two overlapping chat bubbles on the brand green tile. */
function WechatMark() {
  return (
    <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-md bg-[#07c160]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#ffffff">
        <path d="M9.2 4C5.6 4 2.7 6.3 2.7 9.1c0 1.6.9 3 2.4 4l-.6 1.9 2.2-1.1c.8.2 1.6.4 2.5.4h.5a4.6 4.6 0 0 1-.2-1.3c0-2.7 2.7-4.9 6-4.9h.5C15.5 5.6 12.6 4 9.2 4zm-2.4 3.4a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm4.8 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z" />
        <path d="M21.3 13c0-2.3-2.3-4.2-5.1-4.2S11 10.7 11 13s2.3 4.2 5.2 4.2c.6 0 1.2-.1 1.7-.3l1.8.9-.5-1.5c1.2-.8 2.1-2 2.1-3.3zm-6.8-1.1a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm3.4 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z" />
      </svg>
    </span>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const [year, setYear] = useState("");

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-footer-gradient mt-16 border-t border-white/10 text-white">
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-4">
        <div>
          <Link href="/" aria-label="NCWU StyleHub home" className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <BrandLogo inverted />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Everyday style, considered. Discover pieces you&apos;ll reach for again and again,
            at prices that feel right.
          </p>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => showComingSoon("Facebook page")}
              aria-label="Facebook (coming soon)"
              title="Coming soon"
              className="cursor-pointer rounded-full bg-white/10 p-2 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:ring-primary/50"
            >
              <FacebookIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => showComingSoon("Instagram page")}
              aria-label="Instagram (coming soon)"
              title="Coming soon"
              className="cursor-pointer rounded-full bg-white/10 p-2 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:ring-primary/50"
            >
              <InstagramIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => showComingSoon("X page")}
              aria-label="X (coming soon)"
              title="Coming soon"
              className="cursor-pointer rounded-full bg-white/10 p-2 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:ring-primary/50"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/65">
            <li><Link href="/shop" className="cursor-pointer transition-colors hover:text-white">All Products</Link></li>
            <li><Link href="/shop?category=t-shirts" className="cursor-pointer transition-colors hover:text-white">T-Shirts</Link></li>
            <li><Link href="/shop?category=dresses" className="cursor-pointer transition-colors hover:text-white">Dresses</Link></li>
            <li><Link href="/shop?category=jackets-coats" className="cursor-pointer transition-colors hover:text-white">Jackets &amp; Coats</Link></li>
            <li><Link href="/shop?category=shoes" className="cursor-pointer transition-colors hover:text-white">Shoes</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white">Help</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/65">
            <li><Link href="/orders" className="cursor-pointer transition-colors hover:text-white">Order Tracking</Link></li>
            <li><Link href="/track" className="cursor-pointer transition-colors hover:text-white">Track as Guest</Link></li>
            <li><Link href="/account" className="cursor-pointer transition-colors hover:text-white">My Account</Link></li>
            <li><Link href="/wishlist" className="cursor-pointer transition-colors hover:text-white">Saved Items</Link></li>
            <li><Link href="/help/shipping-returns" className="cursor-pointer transition-colors hover:text-white">Shipping &amp; Returns</Link></li>
            <li><Link href="/help/faq" className="cursor-pointer transition-colors hover:text-white">FAQ</Link></li>
            <li><Link href="/help/terms" className="cursor-pointer transition-colors hover:text-white">Terms of Service</Link></li>
            <li><Link href="/help/privacy" className="cursor-pointer transition-colors hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/help/contact" className="cursor-pointer transition-colors hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <span>NCWU Business Street, F1 2nd Floor, Zhengzhou, Henan, China</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-secondary" />
              <a href="tel:17513257179" className="transition-colors hover:text-white">17513257179</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-secondary" />
              <a href="mailto:info@shop.ncwu.site" className="transition-colors hover:text-white">
                info@shop.ncwu.site
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/55 sm:flex-row sm:px-6">
          <p>© {year} NCWU StyleHub. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1.5" title="Alipay">
              <AlipayMark />
              <span>Alipay</span>
            </span>
            <span className="inline-flex items-center gap-1.5" title="WeChat Pay">
              <WechatMark />
              <span>WeChat Pay</span>
            </span>
            <span className="inline-flex items-center gap-1.5" title="Cash on Delivery">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15">
                <Banknote className="h-3.5 w-3.5 text-white" aria-hidden />
              </span>
              <span>Cash on Delivery</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
