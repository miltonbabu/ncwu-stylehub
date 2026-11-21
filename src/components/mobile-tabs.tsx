"use client";

import { cn } from "@/lib/utils";
import { House, LayoutGrid, ReceiptText, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/shop", label: "Shop", icon: LayoutGrid },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/account", label: "Account", icon: User },
];

export function MobileTabs() {
  const pathname = usePathname();
  const { count } = useCart();

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border border-white/70 bg-white/65 pb-[env(safe-area-inset-bottom)] shadow-[0_12px_35px_rgba(30,27,75,0.16)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1.5 py-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 pb-1.5 pt-1.5 text-[10px] font-semibold transition-all",
                active ? "bg-white/80 text-primary shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-brand-text",
              )}
            >
              <span className={cn("relative rounded-full p-1 transition-colors", active && "bg-brand-soft shadow-inner")}>
                <Icon className="h-5 w-5" aria-hidden />
                {label === "Cart" && count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
