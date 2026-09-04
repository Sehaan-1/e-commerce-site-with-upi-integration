import type { OrderStatus } from "@/db/schema";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Payment failed",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  processing: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-200 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-700",
  failed: "bg-rose-100 text-rose-800",
};

/** The happy path shown as a timeline on the tracking page. */
export const TRACKING_STEPS: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

/** Statuses an admin can move an order to. */
export const ADMIN_SELECTABLE_STATUSES: OrderStatus[] = [
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
