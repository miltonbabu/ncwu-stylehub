"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { trackOrder } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatDate, formatPrice, imgFallback, cloudinaryImg } from "@/lib/utils";
import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STATUS_TONES: Record<string, "gold" | "primary" | "accent" | "green" | "red" | "gray"> = {
  pending: "gold",
  paid: "primary",
  shipped: "accent",
  completed: "green",
  cancelled: "red",
};

const STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Delivered" },
];

function TrackContent() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const lookup = async (id: string, mail: string) => {
    if (!id || !mail) {
      setError("Enter both your order number and the email used at checkout.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setOrder(await trackOrder(Number(id), mail));
    } catch {
      setOrder(null);
      setError("We could not find an order with that number and email. Please check both values.");
    } finally {
      setBusy(false);
    }
  };

  // Guest confirmation emails link here with ?order=… — wait for the email before searching.
  useEffect(() => {
    const preset = params.get("order");
    if (preset) setOrderId(preset);
  }, [params]);

  const currentStep = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-primary">
          <PackageSearch className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold text-brand-text">Track Your Order</h1>
        <p className="mt-2 text-sm text-gray-500">
          No account needed — enter your order number and the email you used at checkout.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(orderId, email);
        }}
        className="mt-8 grid gap-4 rounded-2xl border border-gray-100 bg-white p-6 sm:grid-cols-2"
      >
        <Field label="Order number" htmlFor="track-order">
          <Input
            id="track-order"
            required
            inputMode="numeric"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 1042"
          />
        </Field>
        <Field label="Email used at checkout" htmlFor="track-email">
          <Input
            id="track-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
          />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" loading={busy} className="w-full sm:w-auto">
            Find my order
          </Button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-heading text-lg font-bold text-brand-text">Order #{order.id}</p>
              <p className="text-xs text-gray-500">Placed {formatDate(order.created_at)}</p>
            </div>
            <Badge tone={STATUS_TONES[order.status] ?? "gray"}>{order.status}</Badge>
          </div>

          {order.status !== "cancelled" && (
            <ol className="mt-6 grid grid-cols-4 gap-1">
              {STEPS.map((step, index) => {
                const done = index <= currentStep;
                return (
                  <li key={step.key} className="text-center">
                    <span
                      className={cn(
                        "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
                        done ? "bg-primary text-white" : "bg-gray-100 text-gray-400",
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className={cn("mt-1.5 text-[10px] font-medium", done ? "text-brand-text" : "text-gray-400")}>
                      {step.label}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          {order.tracking_number && (
            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Tracking code</p>
              <p className="mt-0.5 font-mono text-sm font-bold tracking-wider text-brand-text">
                {order.tracking_number}
              </p>
            </div>
          )}

          <ul className="mt-5 divide-y divide-gray-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <img
                  src={cloudinaryImg(item.product_image, { width: 120, height: 150 })}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = imgFallback(`order-${item.id}`);
                  }}
                  className="h-14 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-text">{item.product_name}</p>
                  <p className="text-xs text-gray-500">
                    × {item.quantity}
                    {item.size ? ` · Size ${item.size}` : ""}
                    {item.style ? ` · ${item.style}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-brand-text">
                  {formatPrice(item.unit_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">Total</span>
            <span className="font-heading text-lg font-bold text-brand-text">{formatPrice(order.total)}</span>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Delivering to {order.shipping_name}, {order.shipping_address}
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Want saved addresses and order history?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackContent />
    </Suspense>
  );
}
