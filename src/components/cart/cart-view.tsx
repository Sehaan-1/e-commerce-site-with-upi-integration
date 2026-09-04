"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { useCart } from "./cart-context";

export function CartView({ freeShippingThresholdPaise, flatShippingPaise }: { freeShippingThresholdPaise: number; flatShippingPaise: number }) {
  const { lines, ready, subtotalPaise, setQuantity, remove } = useCart();

  if (!ready) return <p className="mt-8 text-ink-500">Loading your cart…</p>;

  if (lines.length === 0) {
    return (
      <div className="card mt-8 p-10 text-center">
        <p className="text-lg font-medium">Your cart is empty.</p>
        <p className="mt-1 text-ink-500">Let&apos;s fix that.</p>
        <Link href="/#shop" className="btn-primary mt-6">Browse products</Link>
      </div>
    );
  }

  const shipping = subtotalPaise >= freeShippingThresholdPaise ? 0 : flatShippingPaise;
  const toFree = freeShippingThresholdPaise - subtotalPaise;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.productId} className="card flex gap-4 p-4">
            <Link href={`/products/${l.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100">
              <Image src={l.imageUrl || "/products/placeholder.svg"} alt={l.name} fill sizes="96px" className="object-cover" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/products/${l.slug}`} className="line-clamp-2 font-medium hover:underline">{l.name}</Link>
                <p className="shrink-0 font-semibold">{formatPaise(l.pricePaise * l.quantity)}</p>
              </div>
              <p className="mt-0.5 text-sm text-ink-500">{formatPaise(l.pricePaise)} each</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex h-9 items-center rounded-full border border-ink-900/15 bg-white">
                  <button type="button" aria-label={`Decrease ${l.name}`} className="h-full w-9" onClick={() => setQuantity(l.productId, l.quantity - 1)}>−</button>
                  <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                  <button type="button" aria-label={`Increase ${l.name}`} className="h-full w-9" disabled={l.quantity >= Math.min(l.maxStock, 10)} onClick={() => setQuantity(l.productId, l.quantity + 1)}>+</button>
                </div>
                <button type="button" onClick={() => remove(l.productId)} className="text-sm text-ink-500 underline underline-offset-4 hover:text-rose-700">Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-ink-700">Subtotal</dt><dd className="font-medium">{formatPaise(subtotalPaise)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-700">Shipping</dt><dd className="font-medium">{shipping === 0 ? "Free" : formatPaise(shipping)}</dd></div>
          <div className="flex justify-between border-t border-ink-900/10 pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-semibold">{formatPaise(subtotalPaise + shipping)}</dd></div>
        </dl>
        {toFree > 0 && <p className="mt-3 rounded-lg bg-sand-100 p-2.5 text-xs text-ink-700">Add {formatPaise(toFree)} more for free shipping.</p>}
        <Link href="/checkout" className="btn-primary mt-5 w-full">Checkout with UPI</Link>
        <p className="mt-3 text-center text-xs text-ink-500">Google Pay · PhonePe · Paytm · BHIM · any UPI app</p>
      </aside>
    </div>
  );
}
