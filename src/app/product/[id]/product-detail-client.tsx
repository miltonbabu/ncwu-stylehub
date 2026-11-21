"use client";

import { ReviewSection } from "@/components/review-section";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addWishlist, api, fetchWishlist, removeWishlist } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";
import { cn, formatPrice, imgFallback, cloudinaryImg } from "@/lib/utils";
import { ChevronRight, Heart, Minus, Plus, Share2, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ProductDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { add } = useCart();
  const { user, ready: authReady } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [style, setStyle] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [activeImage, setActiveImage] = useState("");
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingWish, setSavingWish] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<Product>(`/products/${id}`)
      .then((p) => {
        setProduct(p);
        setActiveImage(p.image_url);
        if (p.variants?.length) {
          const first = p.variants.find((v) => v.stock > 0) ?? p.variants[0];
          setStyle(first.style);
          setSize(first.size);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!authReady || !user || !id) return;
    fetchWishlist()
      .then((list) => setSaved(list.some((p) => String(p.id) === id)))
      .catch(() => setSaved(false));
  }, [authReady, user, id]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-gray-100" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-24 w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
        <h1 className="font-heading text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-gray-500">The product you are looking for does not exist.</p>
        <Button className="mt-6" onClick={() => router.push("/shop")}>
          Back to Shop
        </Button>
      </div>
    );
  }

  const gallery = [product.image_url, ...product.images.map((i) => i.image_url)].filter(
    (url, idx, arr) => url && arr.indexOf(url) === idx,
  );
  const styles = [...new Set((product.variants ?? []).map((v) => v.style).filter(Boolean))];
  const sizes = [...new Set((product.variants ?? []).filter((v) => !style || v.style === style).map((v) => v.size).filter(Boolean))];
  const selectedVariant = product.variants?.find((v) => v.style === style && v.size === size);
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentCompareAt = selectedVariant?.compare_at_price ?? product.compare_at_price;
  const availableStock = selectedVariant?.stock ?? product.stock;
  const discount =
    currentCompareAt && currentCompareAt > currentPrice
      ? Math.round(((currentCompareAt - currentPrice) / currentCompareAt) * 100)
      : 0;

  const sizeOptions = (product.variants?.length ? sizes : (product.sizes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean));

  const addToCart = () => {
    if ((sizeOptions.length > 0 && !size) || (styles.length > 0 && !style) || (product.variants?.length && !selectedVariant)) {
      setSizeError(true);
      return;
    }
    add(product, qty, size, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const buyNow = () => {
    if ((sizeOptions.length > 0 && !size) || (styles.length > 0 && !style) || (product.variants?.length && !selectedVariant)) {
      setSizeError(true);
      return;
    }
    add(product, qty, size, selectedVariant);
    router.push("/checkout");
  };

  const toggleWishlist = async () => {
    if (!user) {
      router.push(`/auth/sign-in?next=/product/${id}`);
      return;
    }
    setSavingWish(true);
    try {
      if (saved) {
        await removeWishlist(product.id);
        setSaved(false);
      } else {
        await addWishlist(product.id);
        setSaved(true);
      }
    } catch {
      window.alert("Could not update your saved items. Please try again.");
    } finally {
      setSavingWish(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
      <nav className="mb-5 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 text-xs text-gray-500 sm:mb-6 sm:text-sm">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/shop?category=${product.category_slug}`} className="hover:text-primary">
          {product.category_name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-brand-text">{product.name}</span>
      </nav>

      <div className="grid gap-7 lg:grid-cols-2 lg:gap-10">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-gray-50">
            <img
              key={activeImage}
              src={cloudinaryImg(activeImage, { width: 1000, height: 1000 })}
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = imgFallback(`product-${product.id}`);
              }}
              className="h-full w-full animate-fade-in object-cover transition-transform duration-500 hover:scale-[1.03]"
            />
            <div className="absolute left-4 top-4 flex flex-col gap-1.5">
              {discount > 0 && <Badge tone="accent">-{discount}%</Badge>}
              {product.is_featured && <Badge tone="gold">Featured</Badge>}
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:gap-3">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  className={cn(
                    "h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 sm:h-20 sm:w-20",
                    activeImage === url
                      ? "scale-105 border-primary shadow-md shadow-primary/10"
                      : "border-transparent opacity-80 hover:border-gray-300 hover:opacity-100",
                  )}
                  aria-label="View product image"
                >
                  <img
                    src={cloudinaryImg(url, { width: 200, height: 200 })}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = imgFallback(`product-${product.id}`);
                    }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <Link
              href={`/shop?category=${product.category_slug}`}
              className="text-sm font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              {product.category_name}
            </Link>
            <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-brand-text sm:text-3xl">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3">
              <StarRating value={product.avg_rating} size={16} />
              <span className="text-xs text-gray-500 sm:text-sm">
                {product.avg_rating.toFixed(1)} · {product.review_count} review{product.review_count === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="font-heading text-2xl font-bold text-brand-text sm:text-3xl">{formatPrice(currentPrice)}</span>
            {currentCompareAt && currentCompareAt > currentPrice && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(currentCompareAt)}</span>
            )}
            {discount > 0 && <Badge tone="accent">Save {discount}%</Badge>}
          </div>

          <p className="text-sm leading-relaxed text-gray-600 sm:text-base">{product.description}</p>

          <div className="flex items-center gap-3">
            <Badge tone={product.stock > 0 ? "green" : "red"}>
              {availableStock > 0 ? `In stock (${availableStock} available)` : "Out of stock"}
            </Badge>
          </div>

          {styles.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-brand-text">Style{style ? <span className="ml-2 font-normal text-gray-500">{style}</span> : null}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {styles.map((option) => (
                  <button key={option} type="button" onClick={() => {
                    setStyle(option);
                    const first = product.variants.find((v) => v.style === option && v.stock > 0) ?? product.variants.find((v) => v.style === option);
                    setSize(first?.size ?? "");
                    setSizeError(false);
                  }} aria-pressed={style === option}
                    className={cn("cursor-pointer rounded-full border px-4 py-2 text-sm font-medium", style === option ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary")}>{option}</button>
                ))}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-brand-text">
                Size{size ? <span className="ml-2 font-normal text-gray-500">{size}</span> : null}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {sizeOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSize(opt);
                      setSizeError(false);
                    }}
                    disabled={!!product.variants?.length && !product.variants.some((v) => v.style === style && v.size === opt && v.stock > 0)}
                    aria-pressed={size === opt}
                    className={cn(
                      "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40",
                      size === opt
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                        : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="mt-2 text-sm text-red-600">Please select a size before adding to cart.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-[auto_auto] gap-2 sm:flex sm:items-center sm:gap-4">
            <div className="flex items-center justify-self-start rounded-full border border-gray-200">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="cursor-pointer rounded-l-full px-4 py-2.5 text-gray-500 hover:bg-brand-soft"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(availableStock, q + 1))}
                className="cursor-pointer rounded-r-full px-4 py-2.5 text-gray-500 hover:bg-brand-soft"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={toggleWishlist}
              disabled={savingWish}
              className={cn(
                "flex h-12 w-12 cursor-pointer items-center justify-center justify-self-end rounded-full border transition-colors sm:order-last",
                saved
                  ? "border-red-300 bg-red-50 text-red-500"
                  : "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500",
                savingWish && "opacity-60",
              )}
              aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-5 w-5", saved && "fill-current")} />
            </button>
            <Button size="lg" onClick={addToCart} disabled={availableStock <= 0} className="col-span-2 w-full min-w-0 sm:col-auto sm:flex-1">
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {added ? "Added to Cart!" : "Add to Cart"}
            </Button>
            <Button size="lg" variant="accent" onClick={buyNow} disabled={availableStock <= 0} className="col-span-2 w-full sm:col-auto sm:w-auto">
              Buy Now
            </Button>
          </div>

          <button type="button" onClick={async () => {
            const share = { title: product.name, text: product.description, url: window.location.href };
            if (navigator.share) await navigator.share(share).catch(() => undefined);
            else if (navigator.clipboard) await navigator.clipboard.writeText(share.url);
          }} className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Share2 className="h-4 w-4" aria-hidden /> Share product
          </button>

          <div className="grid gap-3 rounded-2xl bg-brand-bg p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <Truck className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-brand-text">Free Shipping</p>
                <p className="text-xs text-gray-500">Orders over ¥80</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-brand-text">Secure Checkout</p>
                <p className="text-xs text-gray-500">100% protected payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} />
    </div>
  );
}
