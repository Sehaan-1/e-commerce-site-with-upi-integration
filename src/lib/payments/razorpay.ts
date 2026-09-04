import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@/db/schema";
import { razorpayConfig } from "../config";
import type { PaymentConfirmation, PaymentProvider } from "./types";

/**
 * Razorpay UPI provider.
 * Razorpay is a licensed Indian payment aggregator; its Checkout supports UPI intent
 * (Google Pay, PhonePe, Paytm, BHIM, any UPI app) and UPI collect (enter VPA) as well as
 * dynamic UPI QR. We restrict Checkout to UPI on the client side (see RazorpayButton).
 *
 * Test keys  (rzp_test_...)  -> nothing is charged; Razorpay's test UPI flow lets you pick success/failure.
 * Live keys  (rzp_live_...)  -> real money. Needs completed KYC on the Razorpay dashboard.
 */

const API = "https://api.razorpay.com/v1";

function authHeader() {
  return "Basic " + Buffer.from(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`).toString("base64");
}

function safeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/** HMAC-SHA256(order_id|payment_id, key_secret) must equal razorpay_signature. */
export function verifyRazorpayCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", razorpayConfig.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook body is signed with the webhook secret (set in Razorpay dashboard → Webhooks). */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  if (!razorpayConfig.webhookSecret) return false;
  const expected = createHmac("sha256", razorpayConfig.webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

interface RazorpayPayment {
  id: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  vpa?: string | null;
  acquirer_data?: { rrn?: string; upi_transaction_id?: string };
  upi?: { vpa?: string; flow?: string };
  error_description?: string | null;
  order_id?: string;
  amount?: number;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay fetch payment failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as RazorpayPayment;
}

export function razorpayMethodLabel(p: Pick<RazorpayPayment, "method" | "vpa" | "upi">) {
  if (p.method === "upi") {
    const vpa = p.vpa || p.upi?.vpa;
    const app = vpa?.includes("@ok") ? "Google Pay" : vpa?.includes("@ybl") || vpa?.includes("@ibl") ? "PhonePe" : vpa?.includes("@paytm") ? "Paytm" : vpa?.includes("@upi") ? "BHIM" : null;
    return app ? `UPI · ${app}` : "UPI";
  }
  return p.method ? p.method.toUpperCase() : "Razorpay";
}

export const razorpayProvider: PaymentProvider = {
  id: "razorpay_upi",
  displayName: "UPI (via Razorpay)",
  get mode() {
    return razorpayConfig.isLive ? "live" : "test";
  },
  isConfigured: () => razorpayConfig.configured,

  async createPayment(order: Order) {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader() },
      body: JSON.stringify({
        amount: order.totalPaise,
        currency: order.currency,
        receipt: order.orderNumber,
        notes: { order_number: order.orderNumber, email: order.email },
      }),
    });
    if (!res.ok) {
      throw new Error(`Razorpay order creation failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { id: string };
    return {
      providerOrderId: data.id,
      clientAction: {
        kind: "razorpay_checkout",
        keyId: razorpayConfig.keyId,
        providerOrderId: data.id,
        amountPaise: order.totalPaise,
        currency: order.currency,
        prefill: { name: order.customerName, email: order.email, contact: order.phone },
      },
    };
  },

  async confirmFromClient(order, params): Promise<PaymentConfirmation> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { paid: false, failureReason: "Missing Razorpay parameters", markFailed: false };
    }
    if (razorpay_order_id !== order.providerOrderId) {
      return { paid: false, failureReason: "Razorpay order id mismatch", markFailed: false };
    }
    if (!verifyRazorpayCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return { paid: false, failureReason: "Invalid Razorpay signature", markFailed: false };
    }
    // Signature is valid; double-check status & amount server-to-server.
    const payment = await fetchRazorpayPayment(razorpay_payment_id);
    const captured = payment.status === "captured" || payment.status === "authorized";
    if (!captured) return { paid: false, failureReason: payment.error_description || `Payment status: ${payment.status}`, raw: payment };
    if (payment.amount && payment.amount !== order.totalPaise) {
      return { paid: false, failureReason: "Amount mismatch", raw: payment };
    }
    return { paid: true, providerPaymentId: payment.id, methodLabel: razorpayMethodLabel(payment), raw: payment };
  },
};
