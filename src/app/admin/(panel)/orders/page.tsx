import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, type OrderStatus } from "@/db/schema";
import { formatPaise } from "@/lib/money";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";

export const metadata = { title: "Orders" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "pending", label: "Unpaid" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const valid = FILTERS.some((f) => f.key === status) && status ? (status as OrderStatus) : undefined;
  const rows = await db
    .select()
    .from(orders)
    .where(valid ? eq(orders.status, valid) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return (
    <>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <nav aria-label="Filter" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/admin/orders?status=${f.key}` : "/admin/orders"} className={`rounded-full px-3 py-1.5 text-sm font-medium ${(status || "") === f.key ? "bg-ink-900 text-white" : "bg-white text-ink-700 hover:bg-sand-100"}`}>
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="card mt-6 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">No orders match this filter.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-sand-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Placed</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-900/10">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-sand-50">
                  <td className="p-3 font-mono"><Link href={`/admin/orders/${o.id}`} className="font-semibold underline-offset-4 hover:underline">{o.orderNumber}</Link></td>
                  <td className="p-3">{o.customerName}<br /><span className="text-xs text-ink-500">{o.email} · {o.phone}</span></td>
                  <td className="p-3 font-medium">{formatPaise(o.totalPaise)}</td>
                  <td className="p-3">{o.paymentMethodLabel || o.paymentProvider}<br /><span className="font-mono text-xs text-ink-500">{o.providerPaymentId || "—"}</span></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span></td>
                  <td className="p-3 text-ink-500">{dateFmt.format(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
