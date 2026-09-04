"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  productId: number;
  slug: string;
  name: string;
  pricePaise: number;
  imageUrl: string;
  quantity: number;
  maxStock: number;
}

interface CartContextValue {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalPaise: number;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQuantity: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kl_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        startTransition(() => {
          setLines(parsed);
        });
      }
    } catch {
      /* ignore corrupt cart */
    }
    startTransition(() => {
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback<CartContextValue["add"]>((line, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === line.productId ? { ...l, ...line, quantity: Math.min(l.quantity + qty, line.maxStock, 10) } : l,
        );
      }
      return [...prev, { ...line, quantity: Math.min(qty, line.maxStock, 10) }];
    });
  }, []);

  const setQuantity = useCallback((productId: number, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, Math.min(qty, l.maxStock, 10)) } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId: number) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotalPaise = lines.reduce((s, l) => s + l.quantity * l.pricePaise, 0);
    return { lines, ready, count, subtotalPaise, add, setQuantity, remove, clear };
  }, [lines, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
