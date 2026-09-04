import { NextResponse } from "next/server";
import { CheckoutError, confirmPaymentFromClient } from "@/lib/orders";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/razorpay/verify
 * Called by the browser after Razorpay Checkout's success handler fires.
 * Verifies the HMAC signature + fetches payment status from Razorpay before marking paid.
 */
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || undefined;
  try {
    const body = (await req.json()) as Record<string, string>;
    const { orderNumber, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!orderNumber) return NextResponse.json({ ok: false, error: "orderNumber required" }, { status: 400 });
    logger.info("payments.razorpay.verify.start", { requestId, orderNumber, razorpayOrderId: razorpay_order_id || null, razorpayPaymentId: razorpay_payment_id || null });
    const result = await confirmPaymentFromClient(orderNumber, { razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!result.ok) {
      logger.warn("payments.razorpay.verify.rejected", { requestId, orderNumber, reason: result.reason });
      return NextResponse.json({ ok: false, error: result.reason }, { status: 402 });
    }
    logger.info("payments.razorpay.verify.ok", { requestId, orderNumber, alreadyPaid: Boolean(result.alreadyPaid) });
    return NextResponse.json({ ok: true, orderNumber });
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    logger.error("payments.razorpay.verify.error", { requestId }, err);
    return NextResponse.json({ ok: false, error: "Could not verify payment" }, { status: 500 });
  }
}
