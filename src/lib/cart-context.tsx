"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, Product } from "./types";

interface CartContextValue {
  items: CartLine[];
  ready: boolean;
  add: (product: Product, quantity?: number, size?: string) => void;
  updateQuantity: (productId: number, quantity: number, size?: string) => void;
  remove: (productId: number, size?: string) => void;
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
        setItems(parsed.map((l) => ({ ...l, size: typeof l.size === "string" ? l.size : "" })));
      }
    } catch {
      /* ignore malformed cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((product: Product, quantity = 1, size = "") => {
    setItems((prev) => {
      const existing = prev.find((l) => l.product.id === product.id && l.size === size);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id && l.size === size ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { product, quantity, size }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, size = "") => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((l) => !(l.product.id === productId && l.size === size))
        : prev.map((l) => (l.product.id === productId && l.size === size ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: number, size = "") => {
    setItems((prev) => prev.filter((l) => !(l.product.id === productId && l.size === size)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, l) => sum + l.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
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
