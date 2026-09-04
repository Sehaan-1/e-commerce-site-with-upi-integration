import Link from "next/link";
import { STORE_NAME } from "@/lib/config";
import { CartBadge } from "./cart/cart-badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span aria-hidden className="inline-block h-6 w-6 rounded-full bg-saffron-500" />
          {STORE_NAME}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link href="/#shop" className="rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-sand-100 hover:text-ink-900">
            Shop
          </Link>
          <Link href="/track" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-sand-100 hover:text-ink-900 sm:inline-block">
            Track order
          </Link>
          <CartBadge />
        </nav>
      </div>
    </header>
  );
}
