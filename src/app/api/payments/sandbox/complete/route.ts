import { NextResponse } from "next/server";
import { CheckoutError, confirmPaymentFromClient } from "@/lib/orders";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** POST /api/payments/sandbox/complete — the simulated UPI app calls back here. */
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || undefined;
  try {
    const { orderNumber, token, outcome, app } = (await req.json()) as Record<string, string>;
    if (!orderNumber) return NextResponse.json({ ok: false, error: "orderNumber required" }, { status: 400 });
    logger.info("payments.sandbox.complete.start", { requestId, orderNumber, outcome: outcome || null, app: app || null });
    const result = await confirmPaymentFromClient(orderNumber, { token, outcome, app });
    if (!result.ok) {
      logger.warn("payments.sandbox.complete.rejected", { requestId, orderNumber, reason: result.reason });
      return NextResponse.json({ ok: false, error: result.reason }, { status: 402 });
    }
    logger.info("payments.sandbox.complete.ok", { requestId, orderNumber, alreadyPaid: Boolean(result.alreadyPaid) });
    return NextResponse.json({ ok: true, orderNumber });
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    logger.error("payments.sandbox.complete.error", { requestId }, err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
