"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api, createAddress, fetchAddresses } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import type { Address, Order } from "@/lib/types";
import { cn, formatPrice, FREE_SHIPPING_THRESHOLD, shippingFor } from "@/lib/utils";
import { BadgeCheck, Banknote, Check, MapPin, QrCode, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PAYMENT_METHODS = [
  { id: "alipay", label: "Alipay", icon: Wallet, desc: "Pay with your Alipay account (支付宝)", available: false },
  { id: "wechat", label: "WeChat Pay", icon: QrCode, desc: "Pay with WeChat Pay (微信支付)", available: false },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when you receive the order (货到付款)", available: true },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const { items, subtotal, clear, ready: cartReady } = useCart();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState("cod");
  const [comingSoon, setComingSoon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [activeAddress, setActiveAddress] = useState<number | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  // Checkout is open to guests: no sign-in redirect. Signed-in customers get their
  // name pre-filled and their saved address book loaded.
  useEffect(() => {
    if (user && !name) setName(user.name);
    if (user && !email) setEmail(user.email);
  }, [user, name, email]);

  useEffect(() => {
    if (!user) return;
    fetchAddresses()
      .then((list) => {
        setSavedAddresses(list);
        const preferred = list.find((a) => a.is_default) ?? list[0];
        if (preferred) applyAddress(preferred);
      })
      .catch(() => setSavedAddresses([]));
  }, [user]);

  const applyAddress = (picked: Address) => {
    setActiveAddress(picked.id);
    setName(picked.full_name);
    setPhone(picked.phone);
    setAddress(picked.address);
    setSaveAddress(false);
  };

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          shipping_name: name,
          shipping_address: address,
          shipping_phone: phone,
          payment_method: payment,
          guest_email: user ? null : email,
          items: items.map((l) => ({ product_id: l.product.id, variant_id: l.variant_id, quantity: l.quantity,
            style: l.style || null, size: l.size || null })),
        }),
      });
      // Signed-in customers can keep this address for next time.
      if (user && saveAddress) {
        await createAddress({ label: "Home", full_name: name, phone, address, is_default: savedAddresses.length === 0 })
          .catch(() => undefined);
      }
      setPlaced(order);
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-primary">
          <BadgeCheck className="h-10 w-10" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold text-brand-text">Order Confirmed!</h1>
        <p className="mt-3 text-gray-600">
          Thank you, {placed.shipping_name}. Your order <span className="font-semibold">#{placed.id}</span>{" "}
          for <span className="font-semibold">{formatPrice(placed.total)}</span> has been placed successfully.
        </p>

        {placed.tracking_number && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Your tracking code</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wider text-brand-text">
              {placed.tracking_number}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              A confirmation email is on its way. Track this code anytime from My Account.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => router.push(user ? `/orders/${placed.id}` : `/track?order=${placed.id}`)}>
            Track Order
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/shop")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!ready || !cartReady) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-16">
        <div className="h-96 rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-text">Nothing to check out</h1>
        <p className="mt-2 text-gray-500">Your cart is empty.</p>
        <Button className="mt-6" onClick={() => router.push("/shop")}>
          Go to Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-brand-text">Checkout</h1>
      <p className="mt-1 text-gray-500">Complete your shipping and payment details.</p>

      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="font-heading text-lg font-bold text-brand-text">1. Shipping Information</h2>

            {!user && (
              <p className="mt-3 rounded-lg bg-brand-soft/60 px-3 py-2 text-xs text-brand-text">
                You are checking out as a guest — no account needed.{" "}
                <Link href="/auth/sign-in?next=/checkout" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>{" "}
                if you want to reuse your saved addresses.
              </p>
            )}

            {savedAddresses.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-brand-text">Saved addresses</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {savedAddresses.map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => applyAddress(saved)}
                      className={cn(
                        "flex items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                        activeAddress === saved.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/40",
                      )}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-text">
                          {saved.label || "Address"}
                          {saved.is_default && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-gray-500">{saved.full_name} · {saved.phone}</span>
                        <span className="block truncate text-xs text-gray-500">{saved.address}</span>
                      </span>
                      {activeAddress === saved.id && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" htmlFor="co-name">
                <Input id="co-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Phone Number" htmlFor="co-phone">
                <Input id="co-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+86 138 0000 0000" />
              </Field>
              {!user && (
                <div className="sm:col-span-2">
                  <Field label="Email (for your order confirmation)" htmlFor="co-email">
                    <Input
                      id="co-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                    />
                  </Field>
                </div>
              )}
              <div className="sm:col-span-2">
                <Field label="Shipping Address" htmlFor="co-address">
                  <Textarea
                    id="co-address"
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setActiveAddress(null);
                    }}
                    placeholder="Street, city, province, postal code"
                  />
                </Field>
              </div>
              {user && (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Save this address to my address book
                </label>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="font-heading text-lg font-bold text-brand-text">2. Payment Method</h2>
            <p className="mt-1 text-xs text-gray-500">
              Cash on Delivery is available now. Online payments are on the way.
            </p>
            <div className="mt-5 space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const disabled = !method.available;
                return (
                  <label
                    key={method.id}
                    aria-disabled={disabled}
                    onClick={() => {
                      if (disabled) {
                        setComingSoon(`${method.label} is coming soon. Please choose Cash on Delivery.`);
                      } else {
                        setComingSoon("");
                        setPayment(method.id);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 transition-colors duration-200",
                      disabled
                        ? "cursor-not-allowed border-dashed border-gray-200 bg-gray-50/60"
                        : payment === method.id
                          ? "cursor-pointer border-primary bg-primary/5"
                          : "cursor-pointer border-gray-200 hover:border-primary/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={payment === method.id}
                      disabled={disabled}
                      onChange={() => setPayment(method.id)}
                      className="h-4 w-4 accent-primary disabled:cursor-not-allowed"
                    />
                    <method.icon
                      className={cn("h-5 w-5", disabled ? "text-gray-400" : "text-primary")}
                      aria-hidden
                    />
                    <div className="flex-1">
                      <p className={cn("text-sm font-semibold", disabled ? "text-gray-500" : "text-brand-text")}>
                        {method.label}
                      </p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                    {disabled ? (
                      <span className="shrink-0 rounded-full bg-gray-200/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Coming soon
                      </span>
                    ) : (
                      payment === method.id && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />
                    )}
                  </label>
                );
              })}
            </div>
            {comingSoon && (
              <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                {comingSoon}
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-gray-100 bg-gray-50/70 p-6">
          <h2 className="font-heading text-lg font-bold text-brand-text">Order Summary</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map(({ product, quantity, size }) => (
              <li key={`${product.id}-${size}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="line-clamp-1 text-gray-600">
                  {product.name} <span className="text-gray-400">× {quantity}{size ? ` · Size ${size}` : ""}</span>
                </span>
                <span className="shrink-0 font-semibold text-brand-text">
                  {formatPrice(product.price * quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-brand-text">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Shipping</dt>
              <dd className="font-semibold text-brand-text">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}.
              </p>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-brand-text">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" loading={submitting} className="mt-6 w-full">
            Place Order — {formatPrice(total)}
          </Button>
          <p className="mt-3 text-center text-xs text-gray-400">
            By placing your order you agree to our terms of service.
          </p>
          <Link href="/cart" className="mt-2 block text-center text-sm text-primary hover:underline">
            Back to Cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
