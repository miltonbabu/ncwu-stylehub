"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { FREE_SHIPPING_THRESHOLD, formatPrice, imgFallback, shippingFor, cloudinaryImg } from "@/lib/utils";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, remove, subtotal, clear, ready } = useCart();
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  if (!ready) {
    return <div className="mx-auto max-w-4xl animate-pulse px-4 py-16"><div className="h-96 rounded-[1.75rem] bg-gray-100" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-primary shadow-sm ring-1 ring-primary/10">
          <ShoppingBag className="h-9 w-9" />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-bold text-brand-text">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">Looks like you have not added anything yet.</p>
        <Button size="lg" className="mt-6" onClick={() => router.push("/shop")}>
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="border-b border-gray-100 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">Shopping Cart</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {items.length} item{items.length === 1 ? "" : "s"} in your cart
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-3.5">
          {items.map(({ product, quantity, size, style, variant_id, price, stock }) => (
            <li
              key={`${product.id}-${variant_id ?? "legacy"}-${size}`}
              className="group flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-soft transition-shadow duration-200 hover:shadow-md sm:gap-4 sm:p-4"
            >
              <Link href={`/product/${product.id}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 ring-1 ring-black/5 sm:h-28 sm:w-24">
                <img
                  src={cloudinaryImg(product.image_url, { width: 200, height: 240 })}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = imgFallback(`product-${product.id}`);
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/product/${product.id}`} className="font-heading text-sm font-semibold text-brand-text transition-colors hover:text-primary">
                      {product.name}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                      {product.category_name}
                      {style && <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand-text">{style}</span>}
                      {size && <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand-text">Size: {size}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(product.id, size, variant_id)}
                    className="cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${product.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-gray-200 bg-white">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity - 1, size, variant_id)}
                      className="cursor-pointer rounded-l-full px-3 py-1.5 text-gray-500 transition-colors hover:bg-brand-soft hover:text-primary"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, Math.min(stock, quantity + 1), size, variant_id)}
                      className="cursor-pointer rounded-r-full px-3 py-1.5 text-gray-500 transition-colors hover:bg-brand-soft hover:text-primary"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-heading font-bold text-brand-text">
                    {formatPrice(price * quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={clear}
              className="cursor-pointer text-sm text-gray-400 underline-offset-2 transition-colors hover:text-red-500 hover:underline"
            >
              Clear cart
            </button>
          </li>
        </ul>

        <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-heading text-lg font-bold text-brand-text">Order Summary</h2>
          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <div className="mt-4 rounded-xl bg-brand-soft/60 p-3">
              <p className="text-xs font-medium text-brand-text">
                Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-brand-text">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Shipping</dt>
              <dd className="font-semibold text-brand-text">
                {shipping === 0 ? <span className="text-emerald-600">Free</span> : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3.5 text-base font-bold text-brand-text">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Button size="lg" className="mt-6 w-full" onClick={() => router.push("/checkout")}>
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Button>
          <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-primary transition-opacity hover:opacity-80">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
