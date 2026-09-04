import { redirect } from "next/navigation";
import { getOrderByNumber } from "@/lib/orders";

export const metadata = { title: "Track your order" };
export const dynamic = "force-dynamic";

async function lookup(formData: FormData) {
  "use server";
  const orderNumber = String(formData.get("orderNumber") || "").trim().toUpperCase();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const order = await getOrderByNumber(orderNumber);
  if (!order || order.email !== email) {
    redirect(`/track?error=1&orderNumber=${encodeURIComponent(orderNumber)}`);
  }
  redirect(`/orders/${order.orderNumber}?t=${order.accessToken}`);
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ error?: string; orderNumber?: string }> }) {
  const { error, orderNumber } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Track your order</h1>
      <p className="mt-2 text-ink-700">Enter the order number from your confirmation email and the email you used at checkout.</p>
      <form action={lookup} className="card mt-6 space-y-4 p-6">
        <div>
          <label htmlFor="orderNumber" className="label">Order number</label>
          <input id="orderNumber" name="orderNumber" required defaultValue={orderNumber} placeholder="KL-240101-AB12" className="input font-mono uppercase" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">We couldn&apos;t find an order with those details. Double-check and try again.</p>}
        <button type="submit" className="btn-primary w-full">Find my order</button>
      </form>
    </div>
  );
}
