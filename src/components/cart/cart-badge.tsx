"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartBadge() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
    >
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5 3H2" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
      <span>Cart</span>
      {ready && count > 0 && (
        <span className="cart-badge-bounce ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-saffron-500 px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
