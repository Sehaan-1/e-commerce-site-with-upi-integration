import "server-only";
import { PAYMENT_MODE, razorpayConfig } from "../config";
import { paypalProvider, squareProvider, stripeProvider } from "./future-providers";
import { razorpayProvider } from "./razorpay";
import { sandboxProvider } from "./sandbox";
import type { PaymentProvider, ProviderId } from "./types";

export type { PaymentProvider, ProviderId, ClientAction } from "./types";

/** Every provider the codebase knows about. Order matters: first configured UPI provider wins. */
const REGISTRY: Record<ProviderId, PaymentProvider> = {
  razorpay_upi: razorpayProvider,
  upi_sandbox: sandboxProvider,
  stripe: stripeProvider,
  paypal: paypalProvider,
  square: squareProvider,
};

export function getProvider(id: string): PaymentProvider {
  const p = REGISTRY[id as ProviderId];
  if (!p) throw new Error(`Unknown payment provider: ${id}`);
  return p;
}

/** Which provider handles UPI right now (see PAYMENT_MODE in config.ts). */
export function getActiveUpiProvider(): PaymentProvider {
  if (PAYMENT_MODE === "sandbox") return sandboxProvider;
  if (PAYMENT_MODE === "razorpay") {
    if (!razorpayConfig.configured) {
      throw new Error("PAYMENT_MODE=razorpay but RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing");
    }
    return razorpayProvider;
  }
  return razorpayConfig.configured ? razorpayProvider : sandboxProvider;
}

/** Providers offered at checkout. Today that's just UPI; cards/PayPal appear automatically once configured. */
export function getCheckoutProviders(): PaymentProvider[] {
  const list: PaymentProvider[] = [getActiveUpiProvider()];
  for (const p of [stripeProvider, paypalProvider, squareProvider]) {
    if (p.isConfigured()) list.push(p);
  }
  return list;
}

/** For the admin "Payments" panel. */
export function describeProviders() {
  const active = getActiveUpiProvider();
  return Object.values(REGISTRY).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    mode: p.mode,
    configured: p.isConfigured(),
    active: p.id === active.id || (p.isConfigured() && !["razorpay_upi", "upi_sandbox"].includes(p.id)),
  }));
}
