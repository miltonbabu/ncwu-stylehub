"use client";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=dresses", label: "Dresses" },
  { href: "/shop?category=jackets-coats", label: "Outerwear" },
  { href: "/shop?category=shoes", label: "Shoes" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : "/shop");
    setMenuOpen(false);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <button
          type="button"
          className="cursor-pointer rounded-lg p-2 hover:bg-brand-soft lg:hidden"
          onClick={() => {
            setMenuOpen((v) => !v);
            setSearchOpen(false);
          }}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label="NCWU StyleHub home">
          <BrandLogo />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-brand-text transition-colors duration-200 hover:bg-brand-soft hover:text-primary",
                pathname === link.href && "bg-brand-soft text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 items-center md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="cursor-pointer rounded-full p-2.5 transition-colors duration-200 hover:bg-brand-soft md:hidden"
            aria-label="Search products"
            aria-expanded={searchOpen}
          >
            {searchOpen ? (
              <X className="h-5 w-5 text-brand-text" />
            ) : (
              <Search className="h-5 w-5 text-brand-text" />
            )}
          </button>
          <Link
            href="/wishlist"
            className="hidden rounded-full p-2.5 transition-colors duration-200 hover:bg-brand-soft sm:block"
            aria-label="Saved items"
          >
            <Heart className="h-5 w-5 text-brand-text" />
          </Link>
          <Link
            href="/cart"
            className="relative rounded-full p-2.5 transition-colors duration-200 hover:bg-brand-soft"
            aria-label={`Shopping cart with ${count} items`}
          >
            <ShoppingBag className="h-5 w-5 text-brand-text" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {ready && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-2 pr-3 transition-colors duration-200 hover:border-primary"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="hidden max-w-24 truncate text-sm font-medium sm:block">{user.name}</span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
                  <div className="border-b border-gray-100 px-4 pb-2">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-soft"
                  >
                    <UserIcon className="h-4 w-4" /> My Account
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setAccountOpen(false)}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-soft"
                  >
                    <Heart className="h-4 w-4" /> Saved Items
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setAccountOpen(false)}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-soft"
                  >
                    <ShoppingBag className="h-4 w-4" /> My Orders
                  </Link>
                  {(user.role === "admin" || user.role === "demo_admin") && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountOpen(false)}
                      className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-soft"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setAccountOpen(false);
                      router.push("/");
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : ready ? (
            <Link
              href="/auth/sign-in"
              className="ml-1 hidden h-10 items-center rounded-full bg-brand-text px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary sm:inline-flex"
            >
              Sign In
            </Link>
          ) : null}
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <form onSubmit={onSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              enterKeyHint="search"
              className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-4 text-base focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-brand-soft"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
