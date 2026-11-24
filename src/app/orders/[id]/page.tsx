"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, cancelOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Order } from "@/lib/types";
import type { RefundRequest } from "@/lib/types";
import { cn, formatDate, formatPrice, imgFallback, paymentLabel, cloudinaryImg } from "@/lib/utils";
import { ArrowLeft, Check, MapPin, Package, Phone, RefreshCw, User as UserIcon, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STATUS_TONES: Record<string, "gold" | "primary" | "accent" | "green" | "red" | "gray"> = {
  pending: "gold",
  paid: "primary",
  shipped: "accent",
  completed: "green",
  cancelled: "red",
};

/** Same status set the admin panel uses. */
const TRACKING_STEPS = [
  { key: "pending", label: "Order Placed", desc: "We received your order" },
  { key: "paid", label: "Paid", desc: "Payment confirmed" },
  { key: "shipped", label: "Shipped", desc: "On the way to you" },
  { key: "completed", label: "Delivered", desc: "Enjoy your items" },
];

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [refundItem, setRefundItem] = useState<number | null>(null);
  const [refundQty, setRefundQty] = useState(1);
  const [refundReason, setRefundReason] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const data = await api<Order>(`/orders/${id}`);
    setOrder(data);
    const requests = await api<RefundRequest[]>("/orders/refunds").catch(() => []);
    setRefunds(requests.filter((refund) => refund.order_id === data.id));
  }, [id]);

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/auth/sign-in?next=/orders/${id}`);
      return;
    }
    if (user && id) {
      load()
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [ready, user, id, router, load]);

  const refresh = async () => {
    setBusy(true);
    setNotice("");
    try {
      await load();
      setNotice("Status refreshed from the store.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not refresh the order.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!order) return;
    if (!window.confirm(`Cancel order #${order.id}? This releases the reserved stock and cannot be undone.`)) {
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
      setNotice("Your order was cancelled. A confirmation email is on its way.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not cancel the order.");
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async (itemId: number) => {
    setBusy(true);
    setNotice("");
    try {
      await api<RefundRequest>("/orders/refunds", { method: "POST", body: JSON.stringify({
        order_item_id: itemId, quantity: refundQty, reason: refundReason,
      }) });
      setRefundItem(null);
      setRefundReason("");
      await load();
      setNotice("Refund request submitted. We will email you when it is reviewed.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not submit the refund request.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready || !user || loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-16">
        <div className="h-96 rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold">Order not found</h1>
        <Button className="mt-6" onClick={() => router.push("/orders")}>
          Back to My Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => router.push("/orders")}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Orders
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-text">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Last updated {formatWhen(order.updated_at ?? order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONES[order.status] ?? "gray"}>{order.status.toUpperCase()}</Badge>
          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> Refresh
          </button>
          {(order.status === "pending" || order.status === "paid") && (
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel order
            </button>
          )}
        </div>
      </div>

      {notice && (
        <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-text">{notice}</p>
      )}

      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-text">
            <Package className="h-5 w-5 text-primary" /> Order Tracking
          </h2>
          {order.tracking_number ? (
            <p className="text-sm text-gray-500">
              Tracking number:{" "}
              <span className="font-semibold tracking-wide text-brand-text">{order.tracking_number}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">No tracking number yet — it appears here once the order ships.</p>
          )}
        </div>

        <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            ...TRACKING_STEPS,
            { key: "cancelled", label: "Cancelled", desc: "Order cancelled — stock released" },
          ].map((step, idx) => {
            const cancelled = order.status === "cancelled";
            const currentStep = TRACKING_STEPS.findIndex((s) => s.key === order.status);
            const isCancelStep = step.key === "cancelled";
            const done = !cancelled && !isCancelStep && idx <= currentStep;
            const current = !cancelled && idx === currentStep;
            const cancelActive = cancelled && isCancelStep;
            return (
              <li key={step.key} className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    cancelActive
                      ? "bg-red-600 text-white"
                      : done
                        ? "bg-primary text-white"
                        : "border-2 border-gray-200 bg-white text-gray-400",
                    current && "ring-4 ring-primary/20",
                  )}
                >
                  {cancelActive ? (
                    <XCircle className="h-4 w-4" />
                  ) : done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      cancelActive ? "text-red-600" : done ? "text-brand-text" : "text-gray-400",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {order.status === "cancelled" && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            This order was cancelled and will not be delivered. Reserved stock has been released.
          </p>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-gray-100 bg-white">
          <h2 className="border-b border-gray-500/10 px-6 py-4 font-heading text-lg font-bold text-brand-text">
            Items
          </h2>
          <ul className="divide-y divide-gray-500/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:gap-4 sm:px-6">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                  <img
                    src={cloudinaryImg(item.product_image, { width: 160, height: 192 }) || imgFallback(`item-${item.id}`)}
                    alt={item.product_name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = imgFallback(`item-${item.id}`);
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  {item.product_id ? (
                    <Link href={`/product/${item.product_id}`} className="text-sm font-semibold hover:text-primary">
                      {item.product_name}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold">{item.product_name}</p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatPrice(item.unit_price)} × {item.quantity}
                    {item.style ? <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{item.style}</span> : null}
                    {item.size ? <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">Size: {item.size}</span> : null}
                  </p>
                </div>
                <p className="font-heading font-bold text-brand-text">
                  {formatPrice(item.unit_price * item.quantity)}
                </p>
                {order.status !== "cancelled" && <button type="button" onClick={() => {
                  setRefundItem(refundItem === item.id ? null : item.id);
                  setRefundQty(1);
                }} className="min-h-10 text-sm font-medium text-primary hover:underline">Request refund</button>}
                {refundItem === item.id && <div className="grid w-full min-w-0 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[100px_minmax(0,1fr)_auto]">
                  <label className="text-xs font-medium text-gray-600">Quantity
                    <input type="number" min="1" max={item.quantity} value={refundQty} onChange={(e) => setRefundQty(Math.max(1, Math.min(item.quantity, Number(e.target.value))))}
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-2 text-sm" />
                  </label>
                  <label className="min-w-0 text-xs font-medium text-gray-600">Reason
                    <input value={refundReason} maxLength={1000} onChange={(e) => setRefundReason(e.target.value)} placeholder="Why are you requesting a refund?" required
                      className="mt-1 h-10 w-full min-w-0 rounded-md border border-gray-200 bg-white px-3 text-sm" />
                  </label>
                  <Button type="button" disabled={busy || !refundReason.trim()} onClick={() => submitRefund(item.id)} className="self-end">Submit</Button>
                </div>}
                {refunds.filter((refund) => refund.order_item_id === item.id).map((refund) => (
                  <p key={refund.id} className="w-full text-xs text-gray-500">Refund request: {refund.status} · {refund.quantity} item(s)</p>
                ))}
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-500/10 px-6 py-4 text-right">
            <p className="text-sm text-gray-500">
              Shipping
              <span className="ml-2 font-semibold text-brand-text">
                {order.shipping && order.shipping > 0 ? formatPrice(order.shipping) : "Free"}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Total <span className="ml-2 font-heading text-xl font-bold text-brand-text">{formatPrice(order.total)}</span>
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-6">
            <h2 className="font-heading text-lg font-bold text-brand-text">Shipping</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2.5">
                <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {order.shipping_name}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {order.shipping_address}
              </li>
              {order.shipping_phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {order.shipping_phone}
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-6">
            <h2 className="font-heading text-lg font-bold text-brand-text">Payment</h2>
            <p className="mt-3 text-sm text-gray-600">{paymentLabel(order.payment_method)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
