"use client";

import type { Product } from "@/lib/types";
import { cn, formatPrice, imgFallback, cloudinaryImg } from "@/lib/utils";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { Badge } from "./ui/badge";
import { StarRating } from "./star-rating";
import { useState } from "react";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [src, setSrc] = useState(cloudinaryImg(product.image_url, { width: 640, height: 800 }));
  const srcSet = product.image_url
    ? [320, 480, 640]
        .map((w) => `${cloudinaryImg(product.image_url, { width: w, height: Math.round(w * 1.25) })} ${w}w`)
        .join(", ")
    : undefined;

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : 0;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20",
        className,
      )}
    >
      <div className="relative block aspect-[4/5] overflow-hidden bg-gray-50">
        <Link
          href={`/product/${product.id}`}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 block"
        >
          <img
            src={src}
            srcSet={srcSet}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            alt={product.name}
            loading="lazy"
            onError={() => setSrc(imgFallback(`product-${product.id}`))}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
          />
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1 sm:left-3 sm:top-3">
          {discount > 0 && <Badge tone="accent">-{discount}%</Badge>}
          {product.is_featured && <Badge tone="gold">Featured</Badge>}
          {product.stock <= 0 && <Badge tone="gray">Sold out</Badge>}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 via-black/20 to-transparent opacity-60 transition-opacity duration-400 lg:opacity-0 lg:group-hover:opacity-100" />
        <div className="absolute inset-x-2 bottom-2 z-10 flex translate-y-0 gap-2 opacity-100 transition-all duration-300 sm:inset-x-3 sm:bottom-3 lg:translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          <button
            type="button"
            onClick={onAdd}
            disabled={product.stock <= 0}
            className={cn(
              "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs font-semibold text-white shadow-lg transition-all disabled:opacity-50 hover:scale-110 sm:h-10 sm:w-auto sm:flex-1 sm:gap-1.5 sm:rounded-full sm:text-sm",
              added ? "bg-emerald-600 shadow-emerald-500/40" : "bg-primary hover:bg-primary-dark shadow-primary/30",
            )}
            aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
          >
            {added ? <span className="text-base leading-none">✓</span> : <Plus className="h-5 w-5" aria-hidden />}
            <span className="hidden sm:inline">{added ? "Added!" : "Add to Cart"}</span>
          </button>
          <Link
            href={`/product/${product.id}`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-brand-text shadow-lg backdrop-blur-sm transition-all hover:text-primary hover:scale-110 hover:bg-white sm:h-10 sm:w-10"
            aria-label={`Open ${product.name}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:gap-1.5 sm:p-4">
        <Link
          href={`/shop?category=${product.category_slug}`}
          className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline sm:text-xs"
        >
          {product.category_name}
        </Link>
        <Link href={`/product/${product.id}`} className="line-clamp-2 font-heading text-xs font-semibold text-brand-text hover:text-primary sm:text-sm">
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5">
          <StarRating value={product.avg_rating} size={12} />
          <span className="text-[11px] text-gray-500 sm:text-xs">({product.review_count})</span>
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-heading text-base font-bold text-brand-text sm:text-lg">{formatPrice(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-gray-400 line-through sm:text-sm">{formatPrice(product.compare_at_price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
