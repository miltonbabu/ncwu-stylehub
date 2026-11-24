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
    <header className="surface-glass sticky top-0 z-40 border-b border-gray-100/80 shadow-[0_1px_0_rgba(16,12,34,0.04),0_8px_24px_-20px_rgba(16,12,34,0.35)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <button
          type="button"
          className="cursor-pointer rounded-xl p-2 text-brand-text transition-colors duration-200 hover:bg-brand-soft hover:text-primary active:scale-95 lg:hidden"
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

        <nav className="ml-6 hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium text-brand-text/80 transition-colors duration-200 hover:bg-brand-soft hover:text-primary",
                pathname === link.href && "bg-brand-soft font-semibold text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 items-center md:flex">
          <div className="group relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-10 w-full rounded-full border border-gray-200/80 bg-gray-50/80 pl-10 pr-4 text-sm text-brand-text shadow-inner transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-0.5 md:ml-2">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="cursor-pointer rounded-full p-2.5 text-brand-text transition-all duration-200 hover:bg-brand-soft hover:text-primary active:scale-90 md:hidden"
            aria-label="Search products"
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          <Link
            href="/wishlist"
            className="hidden rounded-full p-2.5 text-brand-text transition-all duration-200 hover:bg-brand-soft hover:text-primary active:scale-90 sm:block"
            aria-label="Saved items"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="relative rounded-full p-2.5 text-brand-text transition-all duration-200 hover:bg-brand-soft hover:text-primary active:scale-90"
            aria-label={`Shopping cart with ${count} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {ready && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="ml-1 flex cursor-pointer items-center gap-2 rounded-full border border-gray-200/80 bg-white/60 py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:border-primary/40 hover:bg-brand-soft/60 hover:shadow-sm"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="hidden max-w-24 truncate text-sm font-medium sm:block">{user.name}</span>
              </button>
              {accountOpen && (
                <div className="animate-scale-in absolute right-0 top-full mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl shadow-brand-text/10">
                  <div className="border-b border-gray-100 px-4 pb-2.5 pt-1.5">
                    <p className="truncate text-sm font-semibold text-brand-text">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="mt-1 flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-brand-soft hover:text-primary"
                  >
                    <UserIcon className="h-4 w-4" /> My Account
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setAccountOpen(false)}
                    className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-brand-soft hover:text-primary"
                  >
                    <Heart className="h-4 w-4" /> Saved Items
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setAccountOpen(false)}
                    className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-brand-soft hover:text-primary"
                  >
                    <ShoppingBag className="h-4 w-4" /> My Orders
                  </Link>
                  {(user.role === "admin" || user.role === "demo_admin") && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountOpen(false)}
                      className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-brand-soft hover:text-primary"
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
                    className="mt-1 flex w-full cursor-pointer items-center gap-2.5 border-t border-gray-100 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : ready ? (
            <Link
              href="/auth/sign-in"
              className="ml-1.5 hidden h-10 items-center rounded-full bg-brand-text px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:shadow-md hover:shadow-primary/25 sm:inline-flex"
            >
              Sign In
            </Link>
          ) : null}
        </div>
      </div>

      {searchOpen && (
        <div className="animate-fade-in border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
          <form onSubmit={onSearch} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              enterKeyHint="search"
              className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-base text-brand-text transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="animate-fade-in border-t border-gray-100 bg-white/95 px-4 pb-4 pt-2 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-text transition-colors hover:bg-brand-soft hover:text-primary"
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
