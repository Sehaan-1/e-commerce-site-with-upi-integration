import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orderItems,
  orderStatusHistory,
  orders,
  paymentEvents,
  products,
  type Order,
  type OrderStatus,
} from "@/db/schema";
import { FLAT_SHIPPING_PAISE, FREE_SHIPPING_THRESHOLD_PAISE } from "./config";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "./email";
import { logger } from "./logger";
import { getActiveUpiProvider, getProvider } from "./payments";
import type { PaymentConfirmation } from "./payments/types";

export interface CheckoutInput {
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  customerNote?: string;
  items: { productId: number; quantity: number }[];
}

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function generateOrderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KL-${ymd}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function computeShipping(subtotalPaise: number) {
  return subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_PAISE;
}

/** Strip HTML tags and null bytes from user-supplied strings to prevent XSS in admin views. */
function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")   // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // strip control chars
    .trim();
}

const MAX_CART_ITEMS = 20; // max distinct line-items per order
const MAX_QTY_PER_ITEM = 10; // max quantity of a single product

function validate(input: CheckoutInput) {
  const required: (keyof CheckoutInput)[] = ["customerName", "email", "phone", "addressLine1", "city", "state", "pincode"];
  for (const k of required) {
    if (!String(input[k] ?? "").trim()) throw new CheckoutError(`Please fill in ${k.replace(/([A-Z])/g, " $1").toLowerCase()}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new CheckoutError("Please enter a valid email address");
  if (!/^[6-9]\d{9}$/.test(input.phone.replace(/\D/g, "").slice(-10))) throw new CheckoutError("Please enter a valid 10-digit Indian mobile number");
  if (!/^\d{6}$/.test(input.pincode.trim())) throw new CheckoutError("Please enter a valid 6-digit PIN code");
  if (!input.items?.length) throw new CheckoutError("Your cart is empty");
  if (input.items.length > MAX_CART_ITEMS) throw new CheckoutError(`Cart cannot exceed ${MAX_CART_ITEMS} different items`);
  for (const item of input.items) {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) throw new CheckoutError("Item quantity must be a positive integer");
    if (qty > MAX_QTY_PER_ITEM) throw new CheckoutError(`Maximum quantity per item is ${MAX_QTY_PER_ITEM}`);
  }
}

/** Creates a pending order and asks the active UPI provider how the browser should pay. */
export async function createOrderAndPayment(input: CheckoutInput) {
  validate(input);
  const provider = getActiveUpiProvider();

  const ids = [...new Set(input.items.map((i) => Number(i.productId)))];
  const rows = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));
  const byId = new Map(rows.map((p) => [p.id, p]));

  const lines = input.items.map((i) => {
    const p = byId.get(Number(i.productId));
    const qty = Math.max(1, Math.min(10, Math.floor(Number(i.quantity) || 0)));
    if (!p) throw new CheckoutError("One of the items in your cart is no longer available");
    if (p.stock < qty) throw new CheckoutError(`Only ${p.stock} left of "${p.name}"`);
    return { product: p, qty };
  });

  const subtotal = lines.reduce((s, l) => s + l.product.pricePaise * l.qty, 0);
  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;

  const order = await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        accessToken: randomBytes(16).toString("hex"),
        // Sanitize all text fields to prevent XSS in admin-rendered content
        customerName: sanitizeText(input.customerName),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.replace(/\D/g, "").slice(-10),
        addressLine1: sanitizeText(input.addressLine1),
        addressLine2: sanitizeText(input.addressLine2 || ""),
        city: sanitizeText(input.city),
        state: sanitizeText(input.state),
        pincode: input.pincode.trim(),
        subtotalPaise: subtotal,
        shippingPaise: shipping,
        totalPaise: total,
        paymentProvider: provider.id,
        customerNote: sanitizeText(input.customerNote || ""),
      })
      .returning();
    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: o.id,
        productId: l.product.id,
        name: l.product.name,
        imageUrl: l.product.imageUrl,
        unitPricePaise: l.product.pricePaise,
        quantity: l.qty,
      })),
    );
    await tx.insert(orderStatusHistory).values({ orderId: o.id, status: "pending", note: "Order placed, awaiting UPI payment" });
    return o;
  });

  const payment = await provider.createPayment(order);
  if (payment.providerOrderId) {
    await db.update(orders).set({ providerOrderId: payment.providerOrderId, updatedAt: new Date() }).where(eq(orders.id, order.id));
  }
  await db.insert(paymentEvents).values({
    orderId: order.id,
    provider: provider.id,
    eventType: "payment.created",
    providerEventId: payment.providerOrderId,
    payload: { amount: total, currency: order.currency },
  });

  return { order, clientAction: payment.clientAction, providerId: provider.id };
}

export async function getOrderByNumber(orderNumber: string) {
  const [o] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
  return o ?? null;
}

export async function getOrderItems(orderId: number) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getOrderHistory(orderId: number) {
  return db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId)).orderBy(orderStatusHistory.createdAt);
}

/**
 * Marks an order paid exactly once (safe to call from both the browser callback AND the
 * webhook), decrements stock, records history and fires the confirmation email.
 */
export async function finalizePaidOrder(order: Order, confirmation: PaymentConfirmation, source: "client" | "webhook") {
  logger.info("payment.finalize.start", { orderNumber: order.orderNumber, source, paid: confirmation.paid });
  if (!confirmation.paid) {
    await db.insert(paymentEvents).values({
      orderId: order.id,
      provider: order.paymentProvider,
      eventType: `payment.failed.${source}`,
      payload: { reason: confirmation.failureReason ?? null, raw: (confirmation.raw as object) ?? null },
    });
    if (order.paymentStatus === "pending" && confirmation.markFailed !== false) {
      await db
        .update(orders)
        .set({ status: "failed", paymentStatus: "failed", updatedAt: new Date() })
        .where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")));
      await db.insert(orderStatusHistory).values({ orderId: order.id, status: "failed", note: confirmation.failureReason || "Payment failed" });
    }
    logger.warn("payment.finalize.failed", { orderNumber: order.orderNumber, source, reason: confirmation.failureReason ?? null });
    return { ok: false as const, reason: confirmation.failureReason || "Payment failed" };
  }

  // Atomic "claim": only the first caller flips pending -> paid.
  const claimed = await db
    .update(orders)
    .set({
      status: "paid",
      paymentStatus: "paid",
      paidAt: new Date(),
      providerPaymentId: confirmation.providerPaymentId ?? null,
      paymentMethodLabel: confirmation.methodLabel ?? "UPI",
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, order.id), inArray(orders.paymentStatus, ["pending", "failed"])))
    .returning();

  await db.insert(paymentEvents).values({
    orderId: order.id,
    provider: order.paymentProvider,
    eventType: `payment.captured.${source}`,
    providerEventId: confirmation.providerPaymentId,
    payload: (confirmation.raw as object) ?? {},
  });

  if (claimed.length === 0) {
    // Already finalised by the other path (webhook vs client). Nothing more to do.
    logger.info("payment.finalize.already_paid", { orderNumber: order.orderNumber, source });
    return { ok: true as const, alreadyPaid: true, order };
  }
  const paidOrder = claimed[0];

  const items = await getOrderItems(order.id);
  await db.transaction(async (tx) => {
    for (const it of items) {
      if (it.productId) {
        await tx
          .update(products)
          .set({ stock: sql`GREATEST(${products.stock} - ${it.quantity}, 0)`, updatedAt: new Date() })
          .where(eq(products.id, it.productId));
      }
    }
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      status: "paid",
      note: `Payment received via ${paidOrder.paymentMethodLabel}${paidOrder.providerPaymentId ? ` (ref ${paidOrder.providerPaymentId})` : ""}`,
    });
  });

  // Fire-and-forget style, but awaited so serverless functions don't get killed mid-send.
  await sendOrderConfirmationEmail(paidOrder, items).catch((e) =>
    logger.error("email.order_confirmation.failed", { orderId: paidOrder.id, orderNumber: paidOrder.orderNumber }, e),
  );

  logger.info("payment.finalize.paid", {
    orderNumber: paidOrder.orderNumber,
    source,
    providerPaymentId: paidOrder.providerPaymentId ?? null,
  });

  return { ok: true as const, alreadyPaid: false, order: paidOrder };
}

/** Browser callback path: look up order, ask the provider to verify, finalise. */
export async function confirmPaymentFromClient(orderNumber: string, params: Record<string, string>) {
  const order = await getOrderByNumber(orderNumber);
  if (!order) throw new CheckoutError("Order not found", 404);
  if (order.paymentStatus === "paid") return { ok: true as const, alreadyPaid: true, order };
  const provider = getProvider(order.paymentProvider);
  const confirmation = await provider.confirmFromClient(order, params);
  return finalizePaidOrder(order, confirmation, "client");
}

/** Admin: move an order to a new status, optionally with tracking info, and email the customer. */
export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  opts: { note?: string; trackingCarrier?: string; trackingNumber?: string; adminNote?: string; notify?: boolean } = {},
) {
  const [updated] = await db
    .update(orders)
    .set({
      status,
      trackingCarrier: opts.trackingCarrier ?? undefined,
      trackingNumber: opts.trackingNumber ?? undefined,
      adminNote: opts.adminNote ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  if (!updated) throw new Error("Order not found");
  await db.insert(orderStatusHistory).values({ orderId, status, note: opts.note || "" });
  if (opts.notify !== false && status !== "paid") {
    await sendOrderStatusEmail(updated, opts.note).catch((e) =>
      logger.error("email.order_status.failed", { orderId: updated.id, orderNumber: updated.orderNumber, status }, e),
    );
  }
  return updated;
}
