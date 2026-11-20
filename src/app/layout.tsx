import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter_Tight } from "next/font/google";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ComingSoonToast } from "@/components/coming-soon";
import { MobileTabs } from "@/components/mobile-tabs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WelcomeBanner } from "@/components/welcome-banner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });

export const metadata: Metadata = {
  title: "NCWU StyleHub — Everyday Style, Considered",
  icons: {
    icon: [{ url: "/stylehub-mark.svg", type: "image/svg+xml" }],
    shortcut: "/stylehub-mark.svg",
  },
  description:
    "Shop the latest fashion: t-shirts, dresses, jackets, jeans, shoes and accessories. Fast shipping, easy returns and secure checkout.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${interTight.variable}`}>
      <body className="min-h-screen bg-brand-bg font-body text-brand-text antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var ok=['aurora','sunset','emerald','ocean','candy','royal','citrus','noir'];var t=localStorage.getItem('stylehub_theme');document.documentElement.setAttribute('data-theme',ok.indexOf(t)>-1?t:'aurora')}catch(e){document.documentElement.setAttribute('data-theme','aurora')}",
          }}
        />
        <AuthProvider>
          <CartProvider>
            <WelcomeBanner />
            <AnnouncementBar />
            <SiteHeader />
            <main className="min-h-[60vh] pb-24 lg:pb-0">{children}</main>
            <SiteFooter />
            <MobileTabs />
            <ComingSoonToast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
