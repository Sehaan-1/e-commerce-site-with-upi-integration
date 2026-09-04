import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, paymentEvents } from "@/db/schema";
import { finalizePaidOrder } from "@/lib/orders";
import { logger } from "@/lib/logger";
import { razorpayMethodLabel, verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/razorpay/webhook
 * Razorpay Dashboard → Settings → Webhooks → URL: https://<your-domain>/api/payments/razorpay/webhook
 * Events to enable: payment.captured, payment.failed
 *
 * This is the safety net: if the customer closes the browser after paying but before
 * /verify runs, the webhook still marks the order paid and sends the email.
 */
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || undefined;
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    logger.warn("payments.razorpay.webhook.invalid_signature", { requestId });
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id?: string; status: string; method?: string; vpa?: string; amount?: number; error_description?: string | null; notes?: Record<string, string> } } };
  };
  const payment = event.payload?.payment?.entity;
  const eventId = req.headers.get("x-razorpay-event-id");

  if (!payment?.order_id) {
    logger.info("payments.razorpay.webhook.ignored", { requestId, event: event.event, eventId: eventId || null });
    await db.insert(paymentEvents).values({ provider: "razorpay_upi", eventType: event.event, providerEventId: eventId, payload: event });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const [order] = await db.select().from(orders).where(eq(orders.providerOrderId, payment.order_id));
  if (!order) {
    logger.warn("payments.razorpay.webhook.unmatched", { requestId, providerOrderId: payment.order_id, event: event.event, eventId: eventId || null });
    await db.insert(paymentEvents).values({ provider: "razorpay_upi", eventType: `${event.event}.unmatched`, providerEventId: eventId, payload: event });
    return NextResponse.json({ ok: true, unmatched: true });
  }

  if (event.event === "payment.captured") {
    if (payment.amount && payment.amount !== order.totalPaise) {
      logger.warn("payments.razorpay.webhook.amount_mismatch", { requestId, orderNumber: order.orderNumber, expected: order.totalPaise, got: payment.amount, eventId: eventId || null });
      await db.insert(paymentEvents).values({ orderId: order.id, provider: "razorpay_upi", eventType: "payment.amount_mismatch", providerEventId: eventId, payload: event });
      return NextResponse.json({ ok: true, mismatch: true });
    }
    logger.info("payments.razorpay.webhook.captured", { requestId, orderNumber: order.orderNumber, eventId: eventId || null, providerPaymentId: payment.id });
    await finalizePaidOrder(
      order,
      { paid: true, providerPaymentId: payment.id, methodLabel: razorpayMethodLabel(payment), raw: event },
      "webhook",
    );
  } else if (event.event === "payment.failed") {
    // Don't flip a paid order back to failed (a retry may have succeeded).
    if (order.paymentStatus !== "paid") {
      logger.warn("payments.razorpay.webhook.failed", { requestId, orderNumber: order.orderNumber, eventId: eventId || null, reason: payment.error_description || "Payment failed" });
      await finalizePaidOrder(order, { paid: false, failureReason: payment.error_description || "Payment failed", raw: event }, "webhook");
    }
  } else {
    logger.info("payments.razorpay.webhook.event", { requestId, orderNumber: order.orderNumber, event: event.event, eventId: eventId || null });
    await db.insert(paymentEvents).values({ orderId: order.id, provider: "razorpay_upi", eventType: event.event, providerEventId: eventId, payload: event });
  }

  return NextResponse.json({ ok: true });
}
