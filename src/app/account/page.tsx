"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Order } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import {
  Check,
  Copy,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  PackageSearch,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

export default function AccountPage() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/auth/sign-in?next=/account");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api<Order[]>("/orders")
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const copyTracking = async (order: Order) => {
    if (!order.tracking_number) return;
    try {
      await navigator.clipboard.writeText(order.tracking_number);
      setCopiedId(order.id);
      window.setTimeout(() => setCopiedId((id) => (id === order.id ? null : id)), 2000);
    } catch {
      /* clipboard can be blocked — the code is still visible to copy manually */
    }
  };

  if (!ready || !user) {
    return <div className="mx-auto max-w-3xl animate-pulse px-4 py-16"><div className="h-64 rounded-3xl bg-gray-100" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-brand-text">My Account</h1>
      <p className="mt-1 text-gray-500">Manage your profile, track orders and save favourites.</p>

      <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-8">
        <div className="flex items-center gap-5">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-gradient text-white">
            <UserIcon className="h-9 w-9" />
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-xl font-bold text-brand-text">{user.name}</h2>
              <Badge tone={user.role === "admin" ? "accent" : "primary"}>{user.role}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <Mail className="h-4 w-4" /> {user.email}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">Member since {formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/orders">
            <Button variant="outline" className="w-full justify-start">
              <PackageSearch className="h-4 w-4" /> My Orders
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" className="w-full justify-start">
              <ShoppingBag className="h-4 w-4" /> Shopping Cart
            </Button>
          </Link>
          <Link href="/wishlist">
            <Button variant="outline" className="w-full justify-start">
              <Heart className="h-4 w-4" /> Saved Items
            </Button>
          </Link>
          {(user.role === "admin" || user.role === "demo_admin") && (
            <Link href="/admin">
              <Button variant="outline" className="w-full justify-start">
                <LayoutDashboard className="h-4 w-4" /> Admin Panel
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Tracking codes */}
      <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-text">Order Tracking Codes</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Copy a code to share with the courier, or open the order for the full timeline.
            </p>
          </div>
          <Link href="/orders" className="text-sm font-semibold text-primary hover:underline">
            All orders
          </Link>
        </div>

        {ordersLoading ? (
          <div className="mt-4 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-xl bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No orders yet — your tracking code appears here after checkout.</p>
            <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.slice(0, 4).map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 p-4 transition-colors hover:border-gray-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-brand-text">#{order.id}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        STATUS_TONE[order.status] ?? "bg-gray-100 text-gray-600",
                      )}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    Tracking:
                    {order.tracking_number ? (
                      <span className="font-mono font-semibold tracking-wide text-brand-text">
                        {order.tracking_number}
                      </span>
                    ) : (
                      <span className="text-gray-400">pending</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-brand-text">{formatPrice(order.total)}</span>
                  <button
                    type="button"
                    onClick={() => copyTracking(order)}
                    disabled={!order.tracking_number}
                    aria-label={`Copy tracking code for order ${order.id}`}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {copiedId === order.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Track
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
