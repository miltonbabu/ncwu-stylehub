"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/lib/types";
import { formatPrice, imgFallback } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    api<Product[]>("/admin/products")
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onDelete = async (id: number) => {
    if (!window.confirm("Delete this product permanently?")) return;
    setDeleting(id);
    try {
      await api(`/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      window.alert("Failed to delete product");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{canManage ? "Upload, edit and manage the catalog." : "Browse the product catalog."}</p>
        </div>
        {canManage && <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4" /> Upload Product
          </Button>
        </Link>}
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white md:block">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-10 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = imgFallback(`product-${product.id}`);
                        }}
                        className="h-11 w-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-semibold text-brand-text">{product.name}</p>
                        <p className="text-xs text-gray-400">#{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{product.category_name}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-brand-text">{formatPrice(product.price)}</p>
                    {product.compare_at_price && (
                      <p className="text-xs text-gray-400 line-through">{formatPrice(product.compare_at_price)}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={product.stock < 5 ? "red" : product.stock < 20 ? "gold" : "green"}>
                      {product.stock} in stock
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={product.is_active ? "green" : "gray"}>{product.is_active ? "Active" : "Hidden"}</Badge>
                      {product.is_featured && <Badge tone="gold">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {canManage && <Link href={`/admin/products/${product.id}/edit`}>
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-primary hover:text-primary"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Link>}
                      {canManage && <button
                        type="button"
                        disabled={deleting === product.id}
                        onClick={() => onDelete(product.id)}
                        className="cursor-pointer rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">
            No products found.
          </div>
        ) : filtered.map((product) => (
          <article key={product.id} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <img
              src={product.image_url}
              alt=""
              onError={(e) => { (e.target as HTMLImageElement).src = imgFallback(`product-${product.id}`); }}
              className="h-20 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-brand-text">{product.name}</h2>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{product.category_name}</p>
                </div>
                <Badge tone={product.is_active ? "green" : "gray"}>{product.is_active ? "Active" : "Hidden"}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="font-semibold text-brand-text">{formatPrice(product.price)}</span>
                <span>{product.stock} in stock</span>
                {product.is_featured && <Badge tone="gold">Featured</Badge>}
              </div>
              {canManage && <div className="mt-2 flex gap-2">
                <Link href={`/admin/products/${product.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button
                  type="button"
                  disabled={deleting === product.id}
                  onClick={() => onDelete(product.id)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
