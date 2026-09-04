import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/db";
import { emailLog, type Order, type OrderItem } from "@/db/schema";
import { STORE_NAME, SUPPORT_EMAIL, getBaseUrl, smtpConfig } from "./config";
import { logger } from "./logger";
import { formatPaise } from "./money";
import { STATUS_LABELS } from "./order-status";

type Template = "order_confirmation" | "order_status_update";

let transporter: Transporter | null = null;
function getTransporter() {
  if (!smtpConfig.configured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: smtpConfig.user ? { user: smtpConfig.user, pass: smtpConfig.pass } : undefined,
    });
  }
  return transporter;
}

async function deliver(opts: {
  orderId: number;
  to: string;
  subject: string;
  html: string;
  text: string;
  template: Template;
}) {
  const t = getTransporter();
  if (!t) {
    logger.info("email.skipped", { orderId: opts.orderId, to: opts.to, template: opts.template, subject: opts.subject, reason: "smtp_not_configured" });
    await db.insert(emailLog).values({
      orderId: opts.orderId,
      recipient: opts.to,
      subject: opts.subject,
      template: opts.template,
      status: "skipped",
      error: "SMTP not configured (set SMTP_HOST etc. in .env)",
    });
    return { ok: false, skipped: true };
  }
  try {
    await t.sendMail({ from: smtpConfig.from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    logger.info("email.sent", { orderId: opts.orderId, to: opts.to, template: opts.template, subject: opts.subject });
    await db.insert(emailLog).values({
      orderId: opts.orderId,
      recipient: opts.to,
      subject: opts.subject,
      template: opts.template,
      status: "sent",
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("email.failed", { orderId: opts.orderId, to: opts.to, template: opts.template, subject: opts.subject, error: message }, err);
    await db.insert(emailLog).values({
      orderId: opts.orderId,
      recipient: opts.to,
      subject: opts.subject,
      template: opts.template,
      status: "failed",
      error: message,
    });
    return { ok: false };
  }
}

function trackingUrl(order: Order) {
  return `${getBaseUrl()}/orders/${order.orderNumber}?t=${order.accessToken}`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f3ee;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1f1b16">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e9e2d8">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a7a66">${escapeHtml(STORE_NAME)}</p>
      <h1 style="margin:0 0 16px;font-size:24px">${title}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:13px;color:#6b5f52">Questions? Reply to this email or write to ${escapeHtml(SUPPORT_EMAIL)}.</p>
    </div>
  </div></body></html>`;
}

function itemsTable(items: OrderItem[], order: Order) {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(i.name)} × ${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPaise(i.unitPricePaise * i.quantity)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
  <tr><td style="padding:8px 0">Subtotal</td><td style="text-align:right">${formatPaise(order.subtotalPaise)}</td></tr>
  <tr><td style="padding:4px 0">Shipping</td><td style="text-align:right">${order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold">Total paid</td><td style="text-align:right;font-weight:bold">${formatPaise(order.totalPaise)}</td></tr></table>`;
}

export async function sendOrderConfirmationEmail(order: Order, items: OrderItem[]) {
  const url = trackingUrl(order);
  const subject = `Order ${order.orderNumber} confirmed — ${STORE_NAME}`;
  const html = shell(
    "Thank you, your order is confirmed!",
    `<p>Hi ${escapeHtml(order.customerName)}, we've received your payment of <strong>${formatPaise(order.totalPaise)}</strong> via ${escapeHtml(order.paymentMethodLabel || "UPI")}.</p>
     <p style="font-size:14px;color:#6b5f52">Order number: <strong>${order.orderNumber}</strong>${order.providerPaymentId ? ` · Payment ref: ${escapeHtml(order.providerPaymentId)}` : ""}</p>
     ${itemsTable(items, order)}
     <p style="margin-top:20px;font-size:14px"><strong>Shipping to</strong><br>${escapeHtml(order.addressLine1)}${order.addressLine2 ? ", " + escapeHtml(order.addressLine2) : ""}<br>${escapeHtml(order.city)}, ${escapeHtml(order.state)} ${escapeHtml(order.pincode)}</p>
     <p style="margin-top:24px"><a href="${url}" style="display:inline-block;background:#1f1b16;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">Track your order</a></p>`,
  );
  const text = `Thank you ${order.customerName}! Order ${order.orderNumber} is confirmed. Total paid: ${formatPaise(order.totalPaise)}.\n\nItems:\n${items.map((i) => `- ${i.name} x${i.quantity}: ${formatPaise(i.unitPricePaise * i.quantity)}`).join("\n")}\n\nTrack your order: ${url}`;
  return deliver({ orderId: order.id, to: order.email, subject, html, text, template: "order_confirmation" });
}

export async function sendOrderStatusEmail(order: Order, note?: string) {
  const url = trackingUrl(order);
  const label = STATUS_LABELS[order.status];
  const subject = `Order ${order.orderNumber} is now ${label.toLowerCase()} — ${STORE_NAME}`;
  const tracking =
    order.trackingNumber
      ? `<p style="font-size:14px"><strong>Tracking:</strong> ${escapeHtml(order.trackingCarrier || "Courier")} · ${escapeHtml(order.trackingNumber)}</p>`
      : "";
  const html = shell(
    `Your order is ${label.toLowerCase()}`,
    `<p>Hi ${escapeHtml(order.customerName)}, here's an update on order <strong>${order.orderNumber}</strong>.</p>
     <p style="font-size:18px;font-weight:600">Status: ${label}</p>${tracking}${note ? `<p style="font-size:14px">${escapeHtml(note)}</p>` : ""}
     <p style="margin-top:24px"><a href="${url}" style="display:inline-block;background:#1f1b16;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">View order</a></p>`,
  );
  const text = `Hi ${order.customerName}, order ${order.orderNumber} is now ${label}.${order.trackingNumber ? ` Tracking: ${order.trackingCarrier || "Courier"} ${order.trackingNumber}.` : ""}${note ? `\n\n${note}` : ""}\n\nView order: ${url}`;
  return deliver({ orderId: order.id, to: order.email, subject, html, text, template: "order_status_update" });
}
