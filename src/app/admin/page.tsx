"use client";

import { ProfitChart, type ProfitPoint } from "@/components/admin/profit-chart";
import { Badge } from "@/components/ui/badge";
import { api, fetchAdminAnalytics } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AdminAnalytics, Review } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Coins,
  Mails,
  MessageSquare,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const RANGES = [7, 30, 90];

export default function AdminDashboard() {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [pending, setPending] = useState<Review[]>([]);
  const [range, setRange] = useState(7);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetchAdminAnalytics(range)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    api<Review[]>("/admin/reviews?status_filter=pending").then(setPending).catch(() => setPending([]));
  }, []);

  const points: ProfitPoint[] = useMemo(
    () =>
      (analytics?.series ?? []).map((p) => {
        const d = new Date(`${p.date}T00:00:00Z`);
        return {
          key: p.date,
          label: d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" }),
          fullLabel: d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          }),
          revenue: p.revenue,
          profit: p.profit,
          orders: p.orders,
        };
      }),
    [analytics],
  );

  const totals = analytics?.totals;
  const hasOrders = (totals?.orders ?? 0) > 0;
  const marginPct =
    totals && totals.revenue > 0 ? Math.round((totals.profit / totals.revenue) * 100) : 0;

  const cards = [
    {
      label: "Revenue",
      value: formatPrice(totals?.revenue ?? 0),
      hint: `last ${range} days`,
      icon: Coins,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Profit",
      value: formatPrice(totals?.profit ?? 0),
      hint: hasOrders ? `${marginPct}% margin` : "from real order costs",
      icon: TrendingUp,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Orders",
      value: String(totals?.orders ?? 0),
      hint: `${totals?.units ?? 0} units sold`,
      icon: ClipboardList,
      tone: "text-accent bg-accent/10",
    },
    {
      label: "Avg. Order",
      value: formatPrice(totals?.avg_order ?? 0),
      hint: "per order",
      icon: ShoppingBag,
      tone: "text-indigo-600 bg-indigo-50",
    },
  ];

  const statusTotal = (analytics?.status_counts ?? []).reduce((s, x) => s + x.count, 0);

  const quickStats = [
    { label: "Products", value: analytics?.products ?? 0, icon: Package, href: "/admin/products" },
    ...(canManage ? [
      { label: "Users", value: analytics?.users ?? 0, icon: Users, href: "/admin/users" },
      { label: "Club Members", value: analytics?.subscribers ?? 0, icon: Mails, href: "/admin/newsletter" },
    ] : []),
    { label: "Pending Reviews", value: analytics?.pending_reviews ?? 0, icon: MessageSquare, href: "/admin/reviews" },
    { label: "Low Stock", value: analytics?.low_stock ?? 0, icon: AlertTriangle, href: "/admin/products" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Sales performance, profit and moderation at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-primary sm:inline">
            Real order data
          </span>
          {canManage && <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            Manage Orders <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">{card.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-brand-text">{card.value}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-text">Sales &amp; Profit</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Daily revenue and profit calculated from the cost recorded on each order line.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--brand)" }} /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} /> Profit
              </span>
            </div>
          </div>

          <div className="flex rounded-full bg-brand-soft p-1">
            {RANGES.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                aria-pressed={range === days}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
                  range === days ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary",
                )}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {!loaded ? (
            <div className="h-[340px] animate-pulse rounded-xl bg-gray-50" />
          ) : !hasOrders ? (
            <div className="flex h-[340px] flex-col items-center justify-center rounded-xl bg-gray-50 text-center">
              <TrendingUp className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-semibold text-brand-text">No orders in the last {range} days</p>
              <p className="mt-1 text-xs text-gray-500">
                Revenue and profit appear here automatically as soon as customers order.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-white"
              >
                View storefront <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ProfitChart points={points} />
          )}
        </div>
      </section>

      {/* Breakdown */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-brand-text">Top Products</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-primary hover:underline">
              All products
            </Link>
          </div>
          {(analytics?.top_products ?? []).length === 0 ? (
            <p className="mt-4 rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              No sales recorded yet.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {(analytics?.top_products ?? []).map((p, i) => {
                const max = analytics?.top_products[0]?.revenue || 1;
                return (
                  <li key={p.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-brand-text">
                        <span className="mr-2 text-xs font-bold text-gray-300">{String(i + 1).padStart(2, "0")}</span>
                        {p.name}
                      </p>
                      <p className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
                        {formatPrice(p.revenue)} · {p.units} sold
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-brand-gradient"
                        style={{ width: `${Math.max((p.revenue / max) * 100, 4)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-brand-text">Order Status</h2>
          <ul className="mt-5 space-y-3">
            {(analytics?.status_counts ?? []).map((s) => {
              const pct = statusTotal > 0 ? Math.round((s.count / statusTotal) * 100) : 0;
              return (
                <li key={s.status} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-medium capitalize text-gray-500">{s.status}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full bg-primary",
                        s.status === "cancelled" && "bg-red-400",
                        s.status === "completed" && "bg-emerald-500",
                        s.status === "shipped" && "bg-accent",
                      )}
                      style={{ width: `${s.count > 0 ? Math.max(pct, 4) : 0}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-brand-text">
                    {s.count}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
            {quickStats.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="rounded-xl bg-gray-50 px-3 py-2.5 transition-colors hover:bg-brand-soft"
              >
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <q.icon className="h-3.5 w-3.5" /> {q.label}
                </span>
                <p className="mt-0.5 font-heading text-lg font-bold text-brand-text">{q.value}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Pending reviews + quick actions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-brand-text">Pending Reviews</h2>
            <Link href="/admin/reviews" className="text-sm font-semibold text-primary hover:underline">
              Manage all
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="mt-4 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              Review queue is empty. Great job!
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.slice(0, 4).map((review) => (
                <li key={review.id} className="flex items-start gap-3 rounded-xl border border-gray-200/70 p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-text">{review.user_name}</p>
                      <Badge tone="gold">{review.rating}★</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{review.comment}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canManage && <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-brand-text">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/admin/products/new"
              className="rounded-xl bg-brand-gradient px-4 py-4 text-center text-sm font-semibold text-white shadow-sm"
            >
              Upload Product
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-xl border border-gray-200 px-4 py-4 text-center text-sm font-semibold text-brand-text transition-colors hover:border-primary hover:text-primary"
            >
              Manage Orders
            </Link>
            <Link
              href="/admin/users"
              className="rounded-xl border border-gray-200 px-4 py-4 text-center text-sm font-semibold text-brand-text transition-colors hover:border-primary hover:text-primary"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/appearance"
              className="rounded-xl border border-gray-200 px-4 py-4 text-center text-sm font-semibold text-brand-text transition-colors hover:border-primary hover:text-primary"
            >
              Change Theme
            </Link>
          </div>
        </section>}
      </div>
    </div>
  );
}
