import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPaise } from "@/lib/money";
import { getOrderByNumber, getOrderHistory, getOrderItems } from "@/lib/orders";
import { STATUS_COLORS, STATUS_LABELS, TRACKING_STEPS } from "@/lib/order-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order" };

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string; new?: string }> };

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function OrderPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t, new: isNew } = await searchParams;
  const order = await getOrderByNumber(orderNumber);
  if (!order || order.accessToken !== t) notFound();
  const [items, history] = await Promise.all([getOrderItems(order.id), getOrderHistory(order.id)]);

  const paid = order.paymentStatus === "paid";
  const currentStep = TRACKING_STEPS.indexOf(order.status);
  const isTerminalBad = order.status === "cancelled" || order.status === "failed";

  return (
    <div className="mx-auto max-w-3xl py-8 sm:py-12">
      {isNew && paid && (
        <div className="mb-6 rounded-2xl bg-emerald-50 p-5 text-emerald-900">
          <p className="text-lg font-semibold">🎉 Payment successful — thank you, {order.customerName.split(" ")[0]}!</p>
          <p className="mt-1 text-sm">A confirmation email is on its way to <strong>{order.email}</strong>. Bookmark this page to track your order.</p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Order</p>
          <h1 className="font-mono text-2xl font-semibold sm:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-500">Placed {dateFmt.format(order.createdAt)} IST</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
      </div>

      {!paid && !isTerminalBad && (
        <div className="card mt-6 border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">Payment not completed yet.</p>
          <p className="mt-1 text-sm text-amber-900/80">If you closed the payment screen, you can go back and finish paying.</p>
          {order.paymentProvider === "upi_sandbox" && (
            <Link href={`/checkout/pay/${order.orderNumber}?t=${order.accessToken}`} className="btn-primary mt-4">Complete payment</Link>
          )}
        </div>
      )}

      {/* Tracking timeline */}
      {!isTerminalBad && (
        <ol className="card mt-6 grid grid-cols-4 gap-2 p-5 sm:p-6">
          {TRACKING_STEPS.map((step, i) => {
            const done = paid && i <= currentStep;
            return (
              <li key={step} className="relative text-center">
                {i > 0 && <span aria-hidden className={`absolute left-[-50%] right-[50%] top-3.5 h-0.5 ${paid && i <= currentStep ? "bg-emerald-500" : "bg-ink-900/10"}`} />}
                <span className={`relative z-10 mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : "bg-sand-200 text-ink-500"}`}>
                  {done ? "✓" : i + 1}
                </span>
                <p className={`mt-2 text-[11px] font-medium sm:text-xs ${done ? "text-ink-900" : "text-ink-500"}`}>{STATUS_LABELS[step]}</p>
              </li>
            );
          })}
        </ol>
      )}

      {order.trackingNumber && (
        <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500">Shipment tracking</p>
            <p className="font-semibold">{order.trackingCarrier || "Courier"} · <span className="font-mono">{order.trackingNumber}</span></p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_260px]">
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-3 divide-y divide-ink-900/10">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                  <Image src={it.imageUrl || "/products/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-ink-500">Qty {it.quantity} × {formatPaise(it.unitPricePaise)}</p>
                </div>
                <p className="text-sm font-semibold">{formatPaise(it.unitPricePaise * it.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-ink-900/10 pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-700">Subtotal</dt><dd>{formatPaise(order.subtotalPaise)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-700">Shipping</dt><dd>{order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}</dd></div>
            <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd>{formatPaise(order.totalPaise)}</dd></div>
          </dl>
        </section>

        <aside className="space-y-4">
          <section className="card p-5 text-sm">
            <h2 className="font-semibold">Payment</h2>
            <p className="mt-2 text-ink-700">{order.paymentMethodLabel || "UPI"}</p>
            {order.providerPaymentId && <p className="mt-1 break-all font-mono text-xs text-ink-500">Ref {order.providerPaymentId}</p>}
            {order.paidAt && <p className="mt-1 text-xs text-ink-500">{dateFmt.format(order.paidAt)}</p>}
          </section>
          <section className="card p-5 text-sm">
            <h2 className="font-semibold">Shipping to</h2>
            <p className="mt-2 text-ink-700">{order.customerName}<br />{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />{order.city}, {order.state} {order.pincode}<br />{order.phone}</p>
          </section>
        </aside>
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="font-semibold">Order history</h2>
        <ol className="mt-3 space-y-3">
          {history.map((h) => (
            <li key={h.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink-900" aria-hidden />
              <div>
                <p className="font-medium">{STATUS_LABELS[h.status]}{h.note ? <span className="font-normal text-ink-700"> — {h.note}</span> : null}</p>
                <p className="text-xs text-ink-500">{dateFmt.format(h.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-8 text-center text-sm text-ink-500">
        <Link href="/#shop" className="underline underline-offset-4">Continue shopping</Link>
      </p>
    </div>
  );
}
