"use client";

import { Badge } from "@/components/ui/badge";
import { api, updateAdminOrder } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/utils";
import { ChevronDown, Mail, MapPin, Phone, Search, Trash2 } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

const STATUS_TONES: Record<string, "gold" | "primary" | "accent" | "green" | "red" | "gray"> = {
  pending: "gold",
  paid: "primary",
  shipped: "accent",
  completed: "green",
  cancelled: "red",
};

const STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [trackingDraft, setTrackingDraft] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api<Order[]>("/admin/orders")
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const saveOrder = async (order: Order, patch: { status?: string; tracking_number?: string }) => {
    setBusyId(order.id);
    try {
      const updated = await updateAdminOrder(order.id, {
        status: patch.status ?? order.status,
        tracking_number: patch.tracking_number ?? order.tracking_number ?? "",
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      setTrackingDraft((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteOrder = async (id: number) => {
    if (!window.confirm(`Permanently delete order #${id}? This cannot be undone.`)) {
      return;
    }
    setBusyId(id);
    try {
      await api(`/admin/orders/${id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      String(o.id).includes(q) ||
      o.shipping_name.toLowerCase().includes(q) ||
      (o.customer_email ?? "").toLowerCase().includes(q) ||
      (o.guest_email ?? "").toLowerCase().includes(q) ||
      (o.shipping_phone ?? "").includes(q) ||
      o.shipping_address.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-brand-text">Order Management</h1>
        <p className="mt-1 text-sm text-gray-500">Track orders, update fulfillment status and shipping tracking numbers.</p>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order # or customer..."
          aria-label="Search orders"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white md:block">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Items</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Payment</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Tracking</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500/5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-5 py-4">
                    <div className="h-10 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const draft = trackingDraft[order.id] ?? order.tracking_number ?? "";
                const email = order.customer_email || order.guest_email || "";
                const isGuest = order.user_id === null;
                const open = expanded === order.id;
                const subtotal = order.total - order.shipping;
                return (
                  <Fragment key={order.id}>
                  <tr className="transition-colors hover:bg-gray-50/60">
                    <td className="px-5 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : order.id)}
                        className="inline-flex cursor-pointer items-center gap-1 font-semibold text-brand-text hover:text-primary"
                        aria-expanded={open}
                      >
                        #{order.id}
                        <ChevronDown className={open ? "h-3.5 w-3.5 rotate-180 transition-transform" : "h-3.5 w-3.5 transition-transform"} />
                      </button>
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium text-brand-text">{order.shipping_name}</p>
                        {isGuest && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            Guest
                          </span>
                        )}
                      </div>
                      <p className="max-w-52 break-all text-xs text-gray-500">{email || "no email"}</p>
                      {order.shipping_phone && (
                        <p className="text-xs text-gray-400">{order.shipping_phone}</p>
                      )}
                      <p className="mt-1 max-w-56 whitespace-normal break-words text-xs leading-snug text-gray-400">
                        {order.shipping_address}
                      </p>
                    </td>
                    <td className="px-5 py-3 align-top text-gray-600">
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-xs whitespace-nowrap">
                            <span className="font-medium text-brand-text">{item.product_name}</span>
                            {item.style ? (
                              <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                {item.style}
                              </span>
                            ) : null}
                            {item.size ? (
                              <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                Size {item.size}
                              </span>
                            ) : null}
                            <span className="ml-1.5 text-gray-400">
                              × {item.quantity} @ {formatPrice(item.unit_price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-3 font-semibold text-brand-text">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3 text-gray-600">{paymentLabel(order.payment_method)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={STATUS_TONES[order.status] ?? "gray"}>{order.status}</Badge>
                        <select
                          value={order.status}
                          disabled={busyId === order.id}
                          onChange={(e) => saveOrder(order, { status: e.target.value })}
                          aria-label={`Update status for order ${order.id}`}
                          className="cursor-pointer rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-primary focus:outline-none disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          value={draft}
                          onChange={(e) =>
                            setTrackingDraft((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          placeholder="Tracking #"
                          aria-label={`Tracking number for order ${order.id}`}
                          className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={busyId === order.id || draft === (order.tracking_number ?? "")}
                          onClick={() => saveOrder(order, { tracking_number: draft })}
                          className="cursor-pointer rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => deleteOrder(order.id)}
                        title="Delete order permanently"
                        className="inline-flex cursor-pointer items-center rounded-lg border border-red-200 p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>

                  {open && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={8} className="px-5 py-5">
                        <div className="grid gap-5 lg:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                              Delivery address
                            </p>
                            <p className="mt-2 text-sm font-semibold text-brand-text">{order.shipping_name}</p>
                            <p className="mt-1 flex items-start gap-1.5 text-sm leading-relaxed text-gray-600">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                              <span className="whitespace-pre-wrap break-words">{order.shipping_address}</span>
                            </p>
                            {order.shipping_phone && (
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                                {order.shipping_phone}
                              </p>
                            )}
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                              <Mail className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                              <span className="break-all">{email || "no email on file"}</span>
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              {isGuest ? "Guest checkout — no account" : `Account: ${order.customer_name || "customer"}`}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                              Payment
                            </p>
                            <dl className="mt-2 space-y-1.5 text-sm">
                              <div className="flex justify-between gap-3">
                                <dt className="text-gray-500">Method</dt>
                                <dd className="font-medium text-brand-text">{paymentLabel(order.payment_method)}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-gray-500">Subtotal</dt>
                                <dd className="text-brand-text">{formatPrice(subtotal)}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-gray-500">Shipping</dt>
                                <dd className="text-brand-text">
                                  {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-3 border-t border-gray-200 pt-1.5">
                                <dt className="font-semibold text-brand-text">Total</dt>
                                <dd className="font-bold text-brand-text">{formatPrice(order.total)}</dd>
                              </div>
                            </dl>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                              Fulfilment
                            </p>
                            <dl className="mt-2 space-y-1.5 text-sm">
                              <div className="flex justify-between gap-3">
                                <dt className="text-gray-500">Status</dt>
                                <dd><Badge tone={STATUS_TONES[order.status] ?? "gray"}>{order.status}</Badge></dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-gray-500">Tracking</dt>
                                <dd className="font-mono text-xs font-semibold text-brand-text">
                                  {order.tracking_number || "pending"}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-gray-500">Placed</dt>
                                <dd className="text-xs text-brand-text">{formatDate(order.created_at)}</dd>
                              </div>
                              {order.updated_at && (
                                <div className="flex justify-between gap-3">
                                  <dt className="text-gray-500">Updated</dt>
                                  <dd className="text-xs text-brand-text">{formatDate(order.updated_at)}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </div>

                        <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
                                <th className="px-3 py-2">Item</th>
                                <th className="px-3 py-2">Style</th>
                                <th className="px-3 py-2">Size</th>
                                <th className="px-3 py-2">Qty</th>
                                <th className="px-3 py-2">Unit price</th>
                                <th className="px-3 py-2 text-right">Line total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {order.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-3 py-2 font-medium text-brand-text">{item.product_name}</td>
                                  <td className="px-3 py-2 text-gray-600">{item.style || "—"}</td>
                                  <td className="px-3 py-2 text-gray-600">{item.size || "—"}</td>
                                  <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                                  <td className="px-3 py-2 text-gray-600">{formatPrice(item.unit_price)}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-brand-text">
                                    {formatPrice(item.unit_price * item.quantity)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">No orders found.</div>
        ) : filtered.map((order) => {
          const draft = trackingDraft[order.id] ?? order.tracking_number ?? "";
          const email = order.customer_email || order.guest_email || "";
          const isGuest = order.user_id === null;
          return (
            <article key={order.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-brand-text">Order #{order.id}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.created_at)} · {paymentLabel(order.payment_method)}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-brand-text">{formatPrice(order.total)}</p>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-brand-text">
                  {order.shipping_name}
                  {isGuest && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      Guest
                    </span>
                  )}
                </p>
                <p className="mt-0.5 break-all text-xs text-gray-500">{email || "no email"}</p>
                {order.shipping_phone && <p className="text-xs text-gray-500">{order.shipping_phone}</p>}
                <p className="mt-1 break-words text-xs text-gray-500">{order.shipping_address}</p>
                <ul className="mt-2 space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="text-xs text-gray-600">
                      {item.product_name}
                      {item.style ? ` · ${item.style}` : ""}
                      {item.size ? ` · ${item.size}` : ""} · {item.quantity} × {formatPrice(item.unit_price)}
                    </li>
                  ))}
                </ul>
                <dl className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Subtotal</dt>
                    <dd className="text-brand-text">{formatPrice(order.total - order.shipping)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Shipping</dt>
                    <dd className="text-brand-text">
                      {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt className="text-brand-text">Total</dt>
                    <dd className="text-brand-text">{formatPrice(order.total)}</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-500">
                  Status
                  <select
                    value={order.status}
                    disabled={busyId === order.id}
                    onChange={(e) => saveOrder(order, { status: e.target.value })}
                    aria-label={`Update status for order ${order.id}`}
                    className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-sm text-brand-text focus:border-primary focus:outline-none disabled:opacity-50"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-500">
                  Tracking number
                  <span className="mt-1 flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setTrackingDraft((prev) => ({ ...prev, [order.id]: e.target.value }))}
                      placeholder="Tracking #"
                      aria-label={`Tracking number for order ${order.id}`}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-sm text-brand-text focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busyId === order.id || draft === (order.tracking_number ?? "")}
                      onClick={() => saveOrder(order, { tracking_number: draft })}
                      className="cursor-pointer rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 disabled:opacity-40"
                    >Save</button>
                  </span>
                </label>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={busyId === order.id}
                  onClick={() => deleteOrder(order.id)}
                  aria-label={`Delete order ${order.id}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 disabled:opacity-40"
                ><Trash2 className="h-3.5 w-3.5" /> Delete order</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
