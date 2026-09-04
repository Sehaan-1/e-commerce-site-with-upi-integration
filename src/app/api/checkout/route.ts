import { NextResponse } from "next/server";
import { CheckoutError, createOrderAndPayment, type CheckoutInput } from "@/lib/orders";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout
 * Body: CheckoutInput (customer details + cart items)
 * Creates a pending order and returns what the browser should do next
 * (open Razorpay Checkout, or redirect to the sandbox UPI page).
 */
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || undefined;
  try {
    const body = (await req.json()) as CheckoutInput;
    logger.info("checkout.start", { requestId, items: Array.isArray(body.items) ? body.items.length : 0 });
    const { order, clientAction, providerId } = await createOrderAndPayment(body);
    logger.info("checkout.created", { requestId, orderNumber: order.orderNumber, providerId });
    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      providerId,
      clientAction,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      logger.warn("checkout.rejected", { requestId, error: err.message, status: err.status });
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logger.error("checkout.error", { requestId }, err);
    return NextResponse.json({ ok: false, error: "Something went wrong while creating your order. Please try again." }, { status: 500 });
  }
}
