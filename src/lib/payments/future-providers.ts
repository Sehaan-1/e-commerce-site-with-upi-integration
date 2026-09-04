import "server-only";
import type { PaymentProvider } from "./types";

/**
 * Placeholders for gateways you said you'll enable later.
 * Each one is intentionally "not configured" today, so it never shows up at checkout.
 *
 * To enable Stripe later, for example:
 *   1. npm install stripe
 *   2. Replace the body below: createPayment -> stripe.checkout.sessions.create({...}) and
 *      return { kind: "redirect", url: session.url }; confirmFromClient -> retrieve the
 *      session / payment_intent and check `payment_status === "paid"`.
 *   3. Add a webhook route under src/app/api/payments/stripe/webhook (copy the Razorpay one).
 *   4. Set STRIPE_SECRET_KEY in .env → isConfigured() becomes true → it appears at checkout.
 */

function notReady(name: string): PaymentProvider["createPayment"] {
  return async () => {
    throw new Error(`${name} is not enabled yet. See src/lib/payments/future-providers.ts`);
  };
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  displayName: "Cards (Stripe)",
  mode: "test",
  isConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
  createPayment: notReady("Stripe"),
  confirmFromClient: async () => ({ paid: false, failureReason: "Stripe not enabled" }),
};

export const paypalProvider: PaymentProvider = {
  id: "paypal",
  displayName: "PayPal",
  mode: "test",
  isConfigured: () => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
  createPayment: notReady("PayPal"),
  confirmFromClient: async () => ({ paid: false, failureReason: "PayPal not enabled" }),
};

export const squareProvider: PaymentProvider = {
  id: "square",
  displayName: "Square",
  mode: "test",
  isConfigured: () => Boolean(process.env.SQUARE_ACCESS_TOKEN),
  createPayment: notReady("Square"),
  confirmFromClient: async () => ({ paid: false, failureReason: "Square not enabled" }),
};
