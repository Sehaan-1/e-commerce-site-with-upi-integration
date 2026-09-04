import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { emailLog, orders, paymentEvents } from "@/db/schema";
import { formatPaise } from "@/lib/money";
import { ADMIN_SELECTABLE_STATUSES, STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { getOrderHistory, getOrderItems } from "@/lib/orders";
import { updateOrderStatusAction } from "../../../actions";

export const metadata = { title: "Order detail" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id)));
  if (!order) notFound();
  const [items, history, events, emails] = await Promise.all([
    getOrderItems(order.id),
    getOrderHistory(order.id),
    db.select().from(paymentEvents).where(eq(paymentEvents.orderId, order.id)).orderBy(desc(paymentEvents.createdAt)),
    db.select().from(emailLog).where(eq(emailLog.orderId, order.id)).orderBy(desc(emailLog.createdAt)),
  ]);

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-ink-700 hover:underline">← All orders</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-2xl font-semibold">{order.orderNumber}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
      </div>
      <p className="text-sm text-ink-500">Placed {dateFmt.format(order.createdAt)} · <Link href={`/orders/${order.orderNumber}?t=${order.accessToken}`} className="underline underline-offset-4" target="_blank">customer view ↗</Link></p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">Items</h2>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-ink-900/10">
                {items.map((it) => (
                  <tr key={it.id}><td className="py-2">{it.name}</td><td className="py-2 text-ink-500">× {it.quantity}</td><td className="py-2 text-right font-medium">{formatPaise(it.unitPricePaise * it.quantity)}</td></tr>
                ))}
                <tr><td colSpan={2} className="pt-3 text-ink-700">Subtotal</td><td className="pt-3 text-right">{formatPaise(order.subtotalPaise)}</td></tr>
                <tr><td colSpan={2} className="text-ink-700">Shipping</td><td className="text-right">{order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}</td></tr>
                <tr className="font-semibold"><td colSpan={2} className="pt-1">Total</td><td className="pt-1 text-right">{formatPaise(order.totalPaise)}</td></tr>
              </tbody>
            </table>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="card p-5 text-sm">
              <h2 className="font-semibold">Customer</h2>
              <p className="mt-2">{order.customerName}<br /><a href={`mailto:${order.email}`} className="underline">{order.email}</a><br /><a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p>
              <h3 className="mt-4 font-semibold">Ship to</h3>
              <p className="mt-1 text-ink-700">{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />{order.city}, {order.state} {order.pincode}</p>
              {order.customerNote && <p className="mt-3 rounded-lg bg-sand-100 p-2 text-xs"><strong>Customer note:</strong> {order.customerNote}</p>}
            </section>
            <section className="card p-5 text-sm">
              <h2 className="font-semibold">Payment</h2>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Status</dt><dd className="font-medium capitalize">{order.paymentStatus}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Provider</dt><dd>{order.paymentProvider}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Method</dt><dd>{order.paymentMethodLabel || "—"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Gateway order</dt><dd className="break-all font-mono text-xs">{order.providerOrderId || "—"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Payment ref</dt><dd className="break-all font-mono text-xs">{order.providerPaymentId || "—"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Paid at</dt><dd>{order.paidAt ? dateFmt.format(order.paidAt) : "—"}</dd></div>
              </dl>
            </section>
          </div>

          <section className="card p-5">
            <h2 className="font-semibold">Timeline</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className="w-36 shrink-0 text-xs text-ink-500">{dateFmt.format(h.createdAt)}</span>
                  <span><strong>{STATUS_LABELS[h.status]}</strong>{h.note ? ` — ${h.note}` : ""}</span>
                </li>
              ))}
            </ol>
          </section>

          <details className="card p-5 text-sm">
            <summary className="cursor-pointer font-semibold">Emails ({emails.length}) &amp; gateway events ({events.length})</summary>
            <ul className="mt-3 space-y-1">
              {emails.map((e) => (
                <li key={e.id} className="flex flex-wrap gap-2"><span className="text-xs text-ink-500">{dateFmt.format(e.createdAt)}</span><span className={`rounded px-1.5 text-xs font-semibold ${e.status === "sent" ? "bg-emerald-100 text-emerald-800" : e.status === "skipped" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"}`}>{e.status}</span><span>{e.subject}</span>{e.error && <span className="text-xs text-ink-500">({e.error})</span>}</li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1 font-mono text-xs">
              {events.map((ev) => <li key={ev.id}>{dateFmt.format(ev.createdAt)} · {ev.eventType} {ev.providerEventId ? `· ${ev.providerEventId}` : ""}</li>)}
            </ul>
          </details>
        </div>

        <aside className="card h-fit p-5">
          <h2 className="font-semibold">Update status</h2>
          <form action={updateOrderStatusAction} className="mt-3 space-y-3 text-sm">
            <input type="hidden" name="id" value={order.id} />
            <div>
              <label htmlFor="status" className="label">New status</label>
              <select id="status" name="status" defaultValue={ADMIN_SELECTABLE_STATUSES.includes(order.status) ? order.status : "paid"} className="input">
                {ADMIN_SELECTABLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="trackingCarrier" className="label">Courier</label>
                <input id="trackingCarrier" name="trackingCarrier" defaultValue={order.trackingCarrier ?? ""} placeholder="Delhivery" className="input" />
              </div>
              <div>
                <label htmlFor="trackingNumber" className="label">Tracking no.</label>
                <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input font-mono" />
              </div>
            </div>
            <div>
              <label htmlFor="note" className="label">Message to customer <span className="text-ink-500">(optional)</span></label>
              <textarea id="note" name="note" rows={2} className="input" placeholder="Shipped via Delhivery, expected in 3–4 days" />
            </div>
            <div>
              <label htmlFor="adminNote" className="label">Internal note</label>
              <textarea id="adminNote" name="adminNote" rows={2} defaultValue={order.adminNote} className="input" />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" name="notify" defaultChecked className="h-4 w-4" /> Email the customer about this update</label>
            <button type="submit" className="btn-primary w-full">Save update</button>
          </form>
        </aside>
      </div>
    </>
  );
}
