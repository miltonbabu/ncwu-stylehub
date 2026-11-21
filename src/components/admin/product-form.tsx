"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { api, API_URL, getToken } from "@/lib/api";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { ImagePlus, Plus, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_IMAGES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ? String(product.category_id) : "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAt, setCompareAt] = useState(product?.compare_at_price ? String(product.compare_at_price) : "");
  const [costPrice, setCostPrice] = useState(product?.cost_price ? String(product.cost_price) : "0");
  const [stock, setStock] = useState(product ? String(product.stock) : "10");
  const [sizes, setSizes] = useState(product?.sizes ?? "");
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? []);
  const [description, setDescription] = useState(product?.description ?? "");
  const [featured, setFeatured] = useState(product?.is_featured ?? false);
  const [active, setActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState<(string | File | null)[]>(() => {
    const urls = product
      ? [...new Set([product.image_url, ...(product.images ?? []).map((i) => i.image_url)].filter(Boolean))].slice(0, MAX_IMAGES)
      : [];
    return [...urls, ...Array(MAX_IMAGES - urls.length).fill(null)];
  });
  const [previews, setPreviews] = useState<(string | null)[]>(() => Array(MAX_IMAGES).fill(null));

  useEffect(() => {
    api<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  const setSlot = (index: number, value: string | File | null) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | null) => {
    setVariants((current) => current.map((variant, i) => i === index ? { ...variant, [field]: value } : variant));
  };

  const onPickFile = (index: number, file: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Only PNG, JPG or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`"${file.name}" is over 5MB — please choose a smaller image`);
      return;
    }
    setError("");
    setPreviews((prev) => prev.map((p, i) => (i === index ? URL.createObjectURL(file) : p)));
    setSlot(index, file);
  };

  const removeSlot = (index: number) => {
    setSlot(index, null);
    setPreviews((prev) => prev.map((p, i) => (i === index ? null : p)));
    setError("");
  };

  const uploadFile = async (productId: number, file: File): Promise<Product> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/v1/admin/products/${productId}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      body: form,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.detail ?? "Image upload failed");
    }
    return (await res.json()) as Product;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError("Please choose a category");
      return;
    }
    const fileSlots = slots
      .map((s, i) => ({ index: i, file: s instanceof File ? s : null }))
      .filter((x): x is { index: number; file: File } => x.file !== null);
    const urlSlots = slots.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
    if (urlSlots.length + fileSlots.length === 0) {
      setError("Add at least one product image (URL or file)");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name,
        category_id: Number(categoryId),
        price: Number(price),
        compare_at_price: compareAt ? Number(compareAt) : null,
        cost_price: costPrice ? Number(costPrice) : 0,
        stock: Number(stock),
        sizes: sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(","),
        variants: variants.length ? variants.map((variant) => ({
          id: variant.id || null,
          style: variant.style,
          size: variant.size,
          price: Number(variant.price),
          compare_at_price: variant.compare_at_price ? Number(variant.compare_at_price) : null,
          cost_price: Number(variant.cost_price ?? 0),
          stock: Number(variant.stock),
          image_url: variant.image_url ?? "",
        })) : [],
        image_url: urlSlots[0] ?? "",
        images: urlSlots,
        description,
        is_featured: featured,
        is_active: active,
      };

      let productId: number;
      if (product) {
        await api(`/admin/products/${product.id}`, { method: "PUT", body: JSON.stringify(payload) });
        productId = product.id;
      } else {
        const created = await api<Product>("/admin/products", { method: "POST", body: JSON.stringify(payload) });
        productId = created.id;
      }

      if (fileSlots.length > 0) {
        const uploadedBySlot: Record<number, string> = {};
        for (const { index, file } of fileSlots) {
          const updated = await uploadFile(productId, file);
          const newest = [...(updated.images ?? [])].sort((a, b) => b.sort_order - a.sort_order)[0];
          uploadedBySlot[index] = newest?.image_url ?? updated.image_url;
        }
        const ordered = slots
          .map((s, i) => (s instanceof File ? uploadedBySlot[i] : typeof s === "string" && s.trim() ? s.trim() : null))
          .filter((u): u is string => Boolean(u));
        await api(`/admin/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify({ image_url: ordered[0] ?? "", images: ordered }),
        });
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <Field label="Product Name" htmlFor="pf-name">
          <Input id="pf-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Classic White Cotton Tee" />
        </Field>
        <Field label="Category" htmlFor="pf-category">
          <Select id="pf-category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (¥)" htmlFor="pf-price">
            <Input id="pf-price" type="number" step="0.01" min="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Compare-at Price (¥)" htmlFor="pf-compare">
            <Input id="pf-compare" type="number" step="0.01" min="0" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
        <Field label="Stock Quantity" htmlFor="pf-stock">
          <Input id="pf-stock" type="number" min="0" required value={stock} onChange={(e) => setStock(e.target.value)} />
        </Field>
        <Field label="Cost Price (¥)" htmlFor="pf-cost">
          <Input
            id="pf-cost"
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            What you pay to source one unit. Used to calculate real profit in the dashboard — never shown to
            customers.
          </p>
        </Field>
        <Field label="Size Options" htmlFor="pf-sizes">
          <Input id="pf-sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S,M,L,XL" />
          <p className="mt-1 text-xs text-gray-400">
            e.g. S,M,L,XL or 38,39,40 — comma-separated. Leave empty if this product has no sizes.
          </p>
        </Field>
        <section className="space-y-3 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-brand-text">Style and size options</h2>
              <p className="mt-1 text-xs text-gray-500">Each row has its own price and stock. Leave empty for a single-option product.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setVariants((rows) => [...rows, {
              id: 0, style: "", size: "", price: Number(price || 0), compare_at_price: null,
              cost_price: Number(costPrice || 0), stock: 0, image_url: "",
            }])}>
              <Plus className="h-4 w-4" aria-hidden /> Add option
            </Button>
          </div>
          {variants.map((variant, index) => (
            <div key={variant.id || `new-${index}`} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-4">
              <Field label="Style" htmlFor={`pf-v-style-${index}`}>
                <Input id={`pf-v-style-${index}`} value={variant.style} onChange={(e) => updateVariant(index, "style", e.target.value)} placeholder="Black" />
              </Field>
              <Field label="Size" htmlFor={`pf-v-size-${index}`}>
                <Input id={`pf-v-size-${index}`} value={variant.size} onChange={(e) => updateVariant(index, "size", e.target.value)} placeholder="M" />
              </Field>
              <Field label="Price (¥)" htmlFor={`pf-v-price-${index}`}>
                <Input id={`pf-v-price-${index}`} type="number" min="0.01" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, "price", Number(e.target.value))} />
              </Field>
              <Field label="Stock" htmlFor={`pf-v-stock-${index}`}>
                <Input id={`pf-v-stock-${index}`} type="number" min="0" value={variant.stock} onChange={(e) => updateVariant(index, "stock", Number(e.target.value))} />
              </Field>
              <Field label="Cost (¥)" htmlFor={`pf-v-cost-${index}`}>
                <Input id={`pf-v-cost-${index}`} type="number" min="0" step="0.01" value={variant.cost_price ?? 0} onChange={(e) => updateVariant(index, "cost_price", Number(e.target.value))} />
              </Field>
              <Field label="Compare-at (¥)" htmlFor={`pf-v-compare-${index}`}>
                <Input id={`pf-v-compare-${index}`} type="number" min="0" step="0.01" value={variant.compare_at_price ?? ""} onChange={(e) => updateVariant(index, "compare_at_price", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <div className="col-span-2 flex items-end justify-end sm:col-span-2">
                <button type="button" onClick={() => setVariants((rows) => rows.filter((_, i) => i !== index))}
                  className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm text-red-600 hover:bg-red-50">
                  <X className="h-4 w-4" aria-hidden /> Remove option
                </button>
              </div>
            </div>
          ))}
        </section>
        <Field label="Description" htmlFor="pf-desc">
          <Textarea id="pf-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the fabric, fit and style..." />
        </Field>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-1 text-sm font-semibold text-brand-text">Product Images</p>
          <p className="mb-3 text-xs text-gray-400">
            Up to {MAX_IMAGES} images — paste a URL or upload a file (PNG/JPG/WEBP, max 5MB each). Slot 1 is the cover image.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {slots.map((slot, i) => {
              const preview = slot instanceof File ? previews[i] : slot;
              return (
                <div key={i} className="rounded-2xl border border-gray-200 p-2.5">
                  <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                    {preview ? (
                      <img src={preview} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-7 w-7 text-gray-300" />
                    )}
                  </div>
                  <Input
                    value={typeof slot === "string" ? slot : ""}
                    onChange={(e) => setSlot(i, e.target.value || null)}
                    placeholder="https://image-url..."
                    className="mb-2 text-xs"
                    disabled={slot instanceof File}
                  />
                  <div className="flex items-center gap-1.5">
                    <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary">
                      <Upload className="h-3 w-3" />
                      {slot instanceof File ? "Replace" : "File"}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onPickFile(i, e.target.files?.[0] ?? null)} />
                    </label>
                    {slot && (
                      <button
                        type="button"
                        onClick={() => removeSlot(i)}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                    {i === 0 && <span className="ml-auto rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">Cover</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-primary" />
            <span className="text-sm font-medium text-brand-text">Featured product (shown on homepage)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-primary" />
            <span className="text-sm font-medium text-brand-text">Active (visible in store)</span>
          </label>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={saving} className="flex-1">
            {product ? "Save Changes" : "Upload Product"}
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={() => router.push("/admin/products")}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
