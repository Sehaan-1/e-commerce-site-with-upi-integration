import type { Order } from "@/db/schema";

/**
 * Every payment gateway (Razorpay UPI today; Stripe / PayPal / Square tomorrow)
 * implements this interface. The checkout flow, order finalisation, emails and
 * admin panel only ever talk to this abstraction — so adding a gateway means
 * adding one file under src/lib/payments/ and registering it in index.ts.
 */

export type ProviderId = "razorpay_upi" | "upi_sandbox" | "stripe" | "paypal" | "square";

/**
 * What the browser needs to complete the payment. Two styles are supported:
 *  - "redirect": send the customer to `url` (hosted page, our sandbox page, PayPal approve URL…)
 *  - "razorpay_checkout": open the Razorpay Checkout modal with `options`
 * Add more kinds (e.g. "stripe_elements") as you add gateways.
 */
export type ClientAction =
  | { kind: "redirect"; url: string }
  | {
      kind: "razorpay_checkout";
      keyId: string;
      providerOrderId: string;
      amountPaise: number;
      currency: string;
      prefill: { name: string; email: string; contact: string };
    };

export interface CreatePaymentResult {
  providerOrderId: string | null;
  clientAction: ClientAction;
}

export interface PaymentConfirmation {
  /** true if the provider says the money was captured */
  paid: boolean;
  providerPaymentId?: string;
  /** e.g. "UPI · Google Pay" — shown on receipts */
  methodLabel?: string;
  /** raw payload for the audit log */
  raw?: unknown;
  failureReason?: string;
  /**
   * false = the request itself was invalid (bad signature / token), so leave the order
   * untouched. true/undefined = the gateway genuinely declined; mark the order failed.
   */
  markFailed?: boolean;
}

export interface PaymentProvider {
  id: ProviderId;
  displayName: string;
  /** "live" | "test" — displayed in the admin so you always know which keys are active */
  mode: "live" | "test";
  /** Are the required env vars present? */
  isConfigured(): boolean;
  /** Called right after the order row is inserted (status = pending). */
  createPayment(order: Order): Promise<CreatePaymentResult>;
  /**
   * Called when the browser returns from the gateway with proof of payment
   * (e.g. Razorpay signature). MUST verify cryptographically — never trust the browser.
   */
  confirmFromClient(order: Order, params: Record<string, string>): Promise<PaymentConfirmation>;
}
