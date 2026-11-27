"use client";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

/** Size options offered by the catalog (apparel letters plus jeans and shoe numbers). */
const SIZE_FILTERS = ["S", "M", "L", "XL", "28", "30", "32", "34", "38", "39", "40", "41", "42"];

function ShopContent() {
  const router = useRouter();
  const params = useSearchParams();
  const categorySlug = params.get("category") ?? "";
  const search = params.get("search") ?? "";
  const sort = params.get("sort") ?? "newest";
  const sizeFilter = params.get("size") ?? "";
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(search);
  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);

  useEffect(() => {
    api<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page_size: "48", sort });
    if (categorySlug) qs.set("category", categorySlug);
    if (search) qs.set("search", search);
    if (sizeFilter) qs.set("size", sizeFilter);
    if (minPrice) qs.set("min_price", minPrice);
    if (maxPrice) qs.set("max_price", maxPrice);
    api<Product[]>(`/products?${qs}`)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categorySlug, search, sort, sizeFilter, minPrice, maxPrice]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/shop?${next.toString()}`);
  };

  const setParamBatch = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/shop?${next.toString()}`);
  };

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = priceMin.trim();
    const max = priceMax.trim();
    if (min && max && Number(min) > Number(max)) {
      setParamBatch({ min: max, max: min });
      return;
    }
    setParamBatch({ min, max });
  };

  const hasFilters = !!(categorySlug || search || sizeFilter || minPrice || maxPrice);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8 border-b border-gray-100 pb-6">
        <p className="eyebrow text-primary">
          {activeCategory ? activeCategory.name : "Our Collection"}
        </p>
        <h1 className="mt-1.5 font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          {activeCategory ? activeCategory.name : "Shop All Products"}
        </h1>
        {activeCategory?.description ? (
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-gray-500">{activeCategory.description}</p>
        ) : (
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-gray-500">
            Thoughtfully selected essentials, ready to ship.
          </p>
        )}
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setParam("category", "")}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
              !categorySlug
                ? "border-primary bg-primary text-white shadow-sm shadow-primary/25"
                : "border-gray-200 bg-white text-brand-text hover:border-primary/40 hover:bg-brand-soft/60 hover:text-primary",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setParam("category", cat.slug)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                categorySlug === cat.slug
                  ? "border-primary bg-primary text-white shadow-sm shadow-primary/25"
                  : "border-gray-200 bg-white text-brand-text hover:border-primary/40 hover:bg-brand-soft/60 hover:text-primary",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("search", query.trim());
            }}
            className="group relative"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search products"
              className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-sm text-brand-text shadow-sm transition-all placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
            />
          </form>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              aria-label="Sort products"
              className="h-10 cursor-pointer rounded-full border border-gray-200 bg-white px-4 text-sm text-brand-text shadow-sm transition-all hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={applyPrice} className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-brand-text">Price</span>
          <input
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="Min"
            aria-label="Minimum price"
            className="h-9 w-20 rounded-lg border border-gray-200 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-gray-400">–</span>
          <input
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="Max"
            aria-label="Maximum price"
            className="h-9 w-20 rounded-lg border border-gray-200 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button type="submit" size="sm" variant="outline" className="h-9">
            Apply
          </Button>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => setParamBatch({ min: "", max: "" })}
              className="text-xs font-medium text-gray-500 underline-offset-2 hover:text-primary hover:underline"
            >
              Reset
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm font-semibold text-brand-text">Size</span>
          {SIZE_FILTERS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setParam("size", sizeFilter === size ? "" : size)}
              aria-pressed={sizeFilter === size}
              className={cn(
                "min-w-9 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95",
                sizeFilter === size
                  ? "border-primary bg-primary text-white shadow-sm shadow-primary/25"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary",
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="stagger-fade grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
              <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              </div>
              <div className="space-y-2.5 p-4">
                <div className="relative h-3 w-1/3 overflow-hidden rounded bg-gray-100">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
                <div className="relative h-4 w-2/3 overflow-hidden rounded bg-gray-100">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
                <div className="relative h-5 w-1/4 overflow-hidden rounded bg-gray-100">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <p className="mb-4 text-xs font-medium text-gray-400">
            Showing {products.length} {products.length === 1 ? "product" : "products"}
          </p>
          <div className="stagger-fade grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-20 text-center">
          <p className="font-heading text-lg font-semibold text-brand-text">No products found</p>
          <p className="mt-1 text-sm text-gray-500">
            {hasFilters
              ? "Try removing a filter or widening the price range."
              : "Try a different search or category."}
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => router.push("/shop")}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
