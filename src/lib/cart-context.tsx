"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, Product, ProductVariant } from "./types";

interface CartContextValue {
  items: CartLine[];
  ready: boolean;
  add: (product: Product, quantity?: number, size?: string, variant?: ProductVariant) => void;
  updateQuantity: (productId: number, quantity: number, size?: string, variantId?: number | null) => void;
  remove: (productId: number, size?: string, variantId?: number | null) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "stylehub_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        // Older carts have no `size`; normalize so every line is keyed consistently.
        setItems(parsed.map((l) => ({ ...l, size: l.size ?? "", style: l.style ?? "",
          variant_id: l.variant_id ?? null, price: l.price ?? l.product.price,
          compare_at_price: l.compare_at_price ?? l.product.compare_at_price,
          stock: l.stock ?? l.product.stock })));
      }
    } catch {
      /* ignore malformed cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((product: Product, quantity = 1, size = "", variant?: ProductVariant) => {
    const variantId = variant?.id ?? null;
    setItems((prev) => {
      const existing = prev.find((l) => l.product.id === product.id && l.variant_id === variantId && l.size === (variant?.size ?? size));
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id && l.variant_id === variantId && l.size === (variant?.size ?? size)
            ? { ...l, quantity: Math.min(l.stock, l.quantity + quantity) } : l,
        );
      }
      return [...prev, { product, quantity, size: variant?.size ?? size, style: variant?.style ?? "",
        variant_id: variantId, price: variant?.price ?? product.price,
        compare_at_price: variant?.compare_at_price ?? product.compare_at_price,
        stock: variant?.stock ?? product.stock }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, size = "", variantId: number | null = null) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((l) => !(l.product.id === productId && l.size === size && l.variant_id === variantId))
        : prev.map((l) => (l.product.id === productId && l.size === size && l.variant_id === variantId
          ? { ...l, quantity: Math.min(l.stock, quantity) } : l)),
    );
  }, []);

  const remove = useCallback((productId: number, size = "", variantId: number | null = null) => {
    setItems((prev) => prev.filter((l) => !(l.product.id === productId && l.size === size && l.variant_id === variantId)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, l) => sum + l.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, ready, add, updateQuantity, remove, clear, count, subtotal }),
    [items, ready, add, updateQuantity, remove, clear, count, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
