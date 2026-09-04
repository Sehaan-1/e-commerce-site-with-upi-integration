import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Order } from "@/db/schema";
import { ADMIN_SESSION_SECRET } from "../config";
import type { PaymentConfirmation, PaymentProvider } from "./types";

/**
 * Built-in UPI sandbox.
 * Simulates the full UPI experience (QR code, app intent buttons, success / failure)
 * WITHOUT any gateway account, so the whole order → payment → email → tracking loop
 * can be tested end-to-end on day one. It never moves real money.
 *
 * It is automatically used when no Razorpay keys are set, or when PAYMENT_MODE=sandbox.
 * It is never used when PAYMENT_MODE=razorpay.
 */

function sign(payload: string) {
  return createHmac("sha256", ADMIN_SESSION_SECRET).update(`sandbox:${payload}`).digest("hex");
}

/** A signed token proves the "payment" came from our sandbox page, not a random POST. */
export function sandboxToken(order: Order) {
  return sign(`${order.orderNumber}:${order.providerOrderId}`);
}

export const sandboxProvider: PaymentProvider = {
  id: "upi_sandbox",
  displayName: "UPI (built-in sandbox simulator)",
  mode: "test",
  isConfigured: () => true,

  async createPayment(order: Order) {
    const providerOrderId = `sbx_order_${randomBytes(8).toString("hex")}`;
    return {
      providerOrderId,
      clientAction: { kind: "redirect", url: `/checkout/pay/${order.orderNumber}?t=${order.accessToken}` },
    };
  },

  async confirmFromClient(order, params): Promise<PaymentConfirmation> {
    const { token, outcome, app } = params;
    const expected = sandboxToken(order);
    const valid =
      typeof token === "string" &&
      token.length === expected.length &&
      timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    if (!valid) return { paid: false, failureReason: "Invalid sandbox token", markFailed: false };
    if (outcome !== "success") return { paid: false, failureReason: "Customer cancelled / UPI app declined (simulated)" };
    const utr = String(Date.now()).slice(-12);
    return {
      paid: true,
      providerPaymentId: `SBXUTR${utr}`,
      methodLabel: `UPI · ${app || "Sandbox"} (test)`,
      raw: { simulated: true, app, utr },
    };
  },
};
