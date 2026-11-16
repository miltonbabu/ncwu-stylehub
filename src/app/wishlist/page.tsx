"use client";

import { Button } from "@/components/ui/button";
import { fetchWishlist, removeWishlist } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";
import { formatPrice, imgFallback } from "@/lib/utils";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WishlistPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const { add } = useCart();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetchWishlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/auth/sign-in?next=/wishlist");
      return;
    }
    if (user) load();
  }, [ready, user, router, load]);

  const removeItem = async (product: Product) => {
    setBusyId(product.id);
    try {
      await removeWishlist(product.id);
      setItems((prev) => prev.filter((p) => p.id !== product.id));
    } catch {
      window.alert("Could not remove this item. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const addToCart = (product: Product) => {
    const hasSizes = (product.sizes ?? "").split(",").map((s) => s.trim()).filter(Boolean).length > 0;
    if (hasSizes) {
      router.push(`/product/${product.id}`);
      return;
    }
    add(product, 1, "");
    router.push("/cart");
  };

  if (!ready || !user || loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-16">
        <div className="h-96 rounded-3xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-brand-text">Saved Items</h1>
      <p className="mt-1 text-gray-500">
        {items.length} saved item{items.length === 1 ? "" : "s"} — your wishlist follows you on every device.
      </p>

      {items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-primary">
            <Heart className="h-8 w-8" />
          </span>
          <p className="mt-4 font-heading text-lg font-semibold text-brand-text">No saved items yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Tap the heart on any product to save it here for later.
          </p>
          <Button className="mt-6" onClick={() => router.push("/shop")}>
            Start Shopping <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <li key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-50">
                <img
                  src={product.image_url}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = imgFallback(`product-${product.id}`);
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <Link href={`/product/${product.id}`} className="line-clamp-1 font-heading text-sm font-semibold hover:text-primary">
                  {product.name}
                </Link>
                <p className="mt-1 text-xs text-gray-500">{product.category_name}</p>
                <p className="mt-2 font-heading font-bold text-brand-text">{formatPrice(product.price)}</p>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Button size="sm" className="flex-1" onClick={() => addToCart(product)}>
                    Add to Cart
                  </Button>
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => removeItem(product)}
                    aria-label={`Remove ${product.name} from saved items`}
                    className="cursor-pointer rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
