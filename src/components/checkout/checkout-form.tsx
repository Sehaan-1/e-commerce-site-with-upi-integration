"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatPaise } from "@/lib/money";
import type { ClientAction } from "@/lib/payments/types";
import { openRazorpayCheckout } from "./razorpay-checkout";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Chandigarh","Andaman & Nicobar Islands","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep",
];

interface Props {
  freeShippingThresholdPaise: number;
  flatShippingPaise: number;
  providerLabel: string;
  isTestMode: boolean;
}

export function CheckoutForm({ freeShippingThresholdPaise, flatShippingPaise, providerLabel, isTestMode }: Props) {
  const router = useRouter();
  const { lines, ready, subtotalPaise, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <p className="text-ink-500">Loading…</p>;
  if (lines.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-lg font-medium">Nothing to check out yet.</p>
        <Link href="/#shop" className="btn-primary mt-6">Browse products</Link>
      </div>
    );
  }

  const shipping = subtotalPaise >= freeShippingThresholdPaise ? 0 : flatShippingPaise;
  const total = subtotalPaise + shipping;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      customerName: String(fd.get("customerName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      addressLine1: String(fd.get("addressLine1") || ""),
      addressLine2: String(fd.get("addressLine2") || ""),
      city: String(fd.get("city") || ""),
      state: String(fd.get("state") || ""),
      pincode: String(fd.get("pincode") || ""),
      customerNote: String(fd.get("customerNote") || ""),
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    };

    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json()) as { ok: boolean; error?: string; orderNumber: string; accessToken: string; clientAction: ClientAction };
      if (!res.ok || !data.ok) throw new Error(data.error || "Checkout failed");

      const action = data.clientAction;
      if (action.kind === "redirect") {
        // Sandbox UPI page (or any hosted gateway page). Cart is cleared after success.
        router.push(action.url);
        return;
      }
      if (action.kind === "razorpay_checkout") {
        const result = await openRazorpayCheckout({
          ...action,
          orderNumber: data.orderNumber,
          description: `Order ${data.orderNumber}`,
        });
        if (result.status === "dismissed") {
          setError("Payment window closed before completing. You can try again — your order is saved.");
          setBusy(false);
          return;
        }
        const verify = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: data.orderNumber, ...result.params }),
        });
        const v = (await verify.json()) as { ok: boolean; error?: string };
        if (!verify.ok || !v.ok) throw new Error(v.error || "We could not verify the payment. If money was debited it will be auto-refunded.");
        clear();
        router.push(`/orders/${data.orderNumber}?t=${data.accessToken}&new=1`);
        return;
      }
      throw new Error("Unsupported payment action");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="customerName" className="label">Full name</label>
              <input id="customerName" name="customerName" required autoComplete="name" className="input" />
            </div>
            <div>
              <label htmlFor="email" className="label">Email (for order confirmation)</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="input" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Mobile number</label>
              <input id="phone" name="phone" type="tel" inputMode="numeric" required autoComplete="tel" placeholder="10-digit mobile" className="input" />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Shipping address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="addressLine1" className="label">Address line 1</label>
              <input id="addressLine1" name="addressLine1" required autoComplete="address-line1" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine2" className="label">Address line 2 <span className="text-ink-500">(optional)</span></label>
              <input id="addressLine2" name="addressLine2" autoComplete="address-line2" className="input" />
            </div>
            <div>
              <label htmlFor="city" className="label">City</label>
              <input id="city" name="city" required autoComplete="address-level2" className="input" />
            </div>
            <div>
              <label htmlFor="state" className="label">State</label>
              <select id="state" name="state" required autoComplete="address-level1" className="input" defaultValue="">
                <option value="" disabled>Select state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pincode" className="label">PIN code</label>
              <input id="pincode" name="pincode" inputMode="numeric" pattern="[0-9]{6}" required autoComplete="postal-code" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="customerNote" className="label">Delivery note <span className="text-ink-500">(optional)</span></label>
              <textarea id="customerNote" name="customerNote" rows={2} className="input" placeholder="Landmark, gift message, etc." />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Payment</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-ink-900 bg-sand-50 p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white" aria-hidden>₹</span>
            <div className="flex-1">
              <p className="font-semibold">UPI</p>
              <p className="text-sm text-ink-700">Google Pay, PhonePe, Paytm, BHIM or any UPI app · {providerLabel}</p>
            </div>
            <span className="text-emerald-700" aria-hidden>✓</span>
          </div>
          {isTestMode && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Test mode.</strong> No real money will be charged. Switch to live keys in <code>.env</code> when you&apos;re ready.
            </p>
          )}
        </section>
      </div>

      <aside className="card h-fit p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Your order</h2>
        <ul className="mt-4 divide-y divide-ink-900/10">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                <Image src={l.imageUrl || "/products/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{l.name}</p>
                <p className="text-xs text-ink-500">Qty {l.quantity}</p>
              </div>
              <p className="text-sm font-semibold">{formatPaise(l.pricePaise * l.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-ink-900/10 pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink-700">Subtotal</dt><dd>{formatPaise(subtotalPaise)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-700">Shipping</dt><dd>{shipping === 0 ? "Free" : formatPaise(shipping)}</dd></div>
          <div className="flex justify-between border-t border-ink-900/10 pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPaise(total)}</dd></div>
        </dl>
        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Preparing payment…" : `Pay ${formatPaise(total)} with UPI`}
        </button>
        <p className="mt-3 text-center text-xs text-ink-500">Your details are used only to fulfil this order.</p>
      </aside>
    </form>
  );
}
