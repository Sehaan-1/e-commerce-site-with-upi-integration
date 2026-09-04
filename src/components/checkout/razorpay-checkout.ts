"use client";

/**
 * Loads Razorpay's Checkout script on demand (only when a real Razorpay payment starts —
 * keeps the storefront bundle light for Lighthouse) and opens it restricted to UPI.
 */

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (r: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
  config?: unknown;
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void; on: (evt: string, cb: (r: unknown) => void) => void };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Could not load Razorpay. Check your connection and try again."));
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

export type RazorpayResult = { status: "success"; params: RazorpaySuccess } | { status: "dismissed" };

export async function openRazorpayCheckout(opts: {
  keyId: string;
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  prefill: { name: string; email: string; contact: string };
  orderNumber: string;
  description: string;
}): Promise<RazorpayResult> {
  await loadScript();
  if (!window.Razorpay) throw new Error("Razorpay unavailable");

  return new Promise<RazorpayResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: opts.keyId,
      amount: opts.amountPaise,
      currency: opts.currency,
      name: process.env.NEXT_PUBLIC_STORE_NAME || "Kalpa Living",
      description: opts.description,
      order_id: opts.providerOrderId,
      prefill: opts.prefill,
      notes: { order_number: opts.orderNumber },
      theme: { color: "#1f1b16" },
      // Show ONLY UPI (intent apps, collect, QR). Remove this block later to enable cards/netbanking.
      config: {
        display: {
          blocks: {
            upi: { name: "Pay with UPI", instruments: [{ method: "upi" }] },
          },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: false },
        },
      },
      handler: (r) => resolve({ status: "success", params: r }),
      modal: { ondismiss: () => resolve({ status: "dismissed" }), confirm_close: true },
    });
    rzp.on("payment.failed", () => {
      /* Razorpay shows its own retry UI; the modal stays open. Nothing to do here. */
    });
    rzp.open();
  });
}
