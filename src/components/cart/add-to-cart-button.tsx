"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/db/schema";
import { useCart } from "./cart-context";

export function AddToCartButton({ product }: { product: Product }) {
  const { add, lines, ready } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, Math.min(10, product.stock) - inCart);
  const soldOut = product.stock <= 0;

  function handleAdd() {
    if (!ready || remaining === 0) return;

    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        pricePaise: product.pricePaise,
        imageUrl: product.imageUrl,
        maxStock: product.stock,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (soldOut) {
    return <button className="btn-primary w-full sm:w-auto" disabled>Sold out</button>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex h-12 items-center rounded-full border border-ink-900/15 bg-white">
        <button type="button" aria-label="Decrease quantity" className="h-full w-11 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
        <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
        <button type="button" aria-label="Increase quantity" className="h-full w-11 text-lg" onClick={() => setQty((q) => Math.min(remaining || 1, q + 1))}>+</button>
      </div>
      <button type="button" onClick={handleAdd} disabled={!ready || remaining === 0} className="btn-primary h-12 flex-1 sm:flex-none sm:px-8">
        {added ? "Added ✓" : remaining === 0 ? "Max in cart" : "Add to cart"}
      </button>
      {inCart > 0 && (
        <Link href="/cart" className="text-sm font-medium text-ink-700 underline underline-offset-4">
          {inCart} in cart · Checkout
        </Link>
      )}
    </div>
  );
}
