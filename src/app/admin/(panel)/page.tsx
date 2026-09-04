import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { formatPaise } from "@/lib/money";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { getActiveUpiProvider } from "@/lib/payments";
import { ensureSeeded } from "@/lib/catalog";

export const metadata = { title: "Admin dashboard" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function AdminDashboard() {
  await ensureSeeded();
  const [[stats], [lowStock], recent] = await Promise.all([
    db
      .select({
        orders: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'paid')::int`,
        revenue: sql<number>`coalesce(sum(${orders.totalPaise}) filter (where ${orders.paymentStatus} = 'paid'), 0)::int`,
        toShip: sql<number>`count(*) filter (where ${orders.status} in ('paid','processing'))::int`,
        pending: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'pending')::int`,
      })
      .from(orders),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(sql`${products.stock} <= 5 and ${products.active} = true`),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
  ]);
  const provider = getActiveUpiProvider();

  const cards = [
    { label: "Paid orders", value: String(stats.orders) },
    { label: "Revenue", value: formatPaise(stats.revenue) },
    { label: "Awaiting shipment", value: String(stats.toShip), href: "/admin/orders?status=paid" },
    { label: "Low stock products", value: String(lowStock.count), href: "/admin/products" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${provider.mode === "live" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
          Payments: {provider.displayName} · {provider.mode.toUpperCase()}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="text-xs uppercase tracking-wider text-ink-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold">{c.value}</p>
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="card p-5 hover:shadow-md">{inner}</Link>
          ) : (
            <div key={c.label} className="card p-5">{inner}</div>
          );
        })}
      </div>

      <section className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-900/10 p-4">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-ink-700 underline underline-offset-4">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">No orders yet. Place a test order from the storefront to see it here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Placed</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-900/10">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-sand-50">
                    <td className="p-3 font-mono"><Link href={`/admin/orders/${o.id}`} className="underline-offset-4 hover:underline">{o.orderNumber}</Link></td>
                    <td className="p-3">{o.customerName}<br /><span className="text-xs text-ink-500">{o.email}</span></td>
                    <td className="p-3 font-medium">{formatPaise(o.totalPaise)}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span></td>
                    <td className="p-3 text-ink-500">{dateFmt.format(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-4 text-xs text-ink-500">Pending (unpaid) orders: {stats.pending}. These are carts where the customer started but didn&apos;t finish paying.</p>
    </>
  );
}
