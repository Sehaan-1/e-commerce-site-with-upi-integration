import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { STORE_NAME } from "@/lib/config";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-sand-50">
      <header className="border-b border-ink-900/10 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold">{STORE_NAME} <span className="text-ink-500">admin</span></Link>
            <nav aria-label="Admin" className="hidden items-center gap-1 sm:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-sand-100 hover:text-ink-900">{n.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-ink-700 hover:underline">View store ↗</Link>
            <form action={logoutAction}>
              <button type="submit" className="rounded-full border border-ink-900/15 px-3 py-1.5 text-sm font-medium hover:bg-sand-100">Log out</button>
            </form>
          </div>
        </div>
        <nav aria-label="Admin mobile" className="flex gap-1 overflow-x-auto border-t border-ink-900/10 px-3 py-2 sm:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 rounded-full bg-sand-100 px-3 py-1.5 text-sm font-medium text-ink-700">{n.label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
