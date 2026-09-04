import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * All money is stored in the smallest currency unit (paise for INR).
 * ₹499.00 => 49900. This avoids floating point errors and matches what
 * every payment gateway (Razorpay, Stripe, PayPal) expects.
 */

export const orderStatusEnum = pgEnum("order_status", [
  "pending", // created, awaiting payment
  "paid", // payment confirmed
  "processing", // being packed
  "shipped",
  "delivered",
  "cancelled",
  "failed", // payment failed / abandoned
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 80 }).notNull().default("General"),
  pricePaise: integer("price_paise").notNull(),
  compareAtPaise: integer("compare_at_paise"),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url").notNull().default(""),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 40 }).notNull().unique(),
  /** Random secret used in tracking links so customers can view their order without an account. */
  accessToken: varchar("access_token", { length: 64 }).notNull(),

  customerName: varchar("customer_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  addressLine1: varchar("address_line1", { length: 240 }).notNull(),
  addressLine2: varchar("address_line2", { length: 240 }).notNull().default(""),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 120 }).notNull(),
  pincode: varchar("pincode", { length: 12 }).notNull(),

  subtotalPaise: integer("subtotal_paise").notNull(),
  shippingPaise: integer("shipping_paise").notNull().default(0),
  totalPaise: integer("total_paise").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),

  status: orderStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),

  /** Which provider handled the payment: "razorpay_upi", "upi_sandbox", later "stripe", "paypal" ... */
  paymentProvider: varchar("payment_provider", { length: 40 }).notNull(),
  /** Provider-side order/intent id (e.g. Razorpay order_XXXX) */
  providerOrderId: varchar("provider_order_id", { length: 120 }),
  /** Provider-side payment/transaction id (e.g. Razorpay pay_XXXX or UPI UTR) */
  providerPaymentId: varchar("provider_payment_id", { length: 120 }),
  paymentMethodLabel: varchar("payment_method_label", { length: 80 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),

  trackingCarrier: varchar("tracking_carrier", { length: 80 }),
  trackingNumber: varchar("tracking_number", { length: 120 }),
  customerNote: text("customer_note").notNull().default(""),
  adminNote: text("admin_note").notNull().default(""),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: varchar("name", { length: 200 }).notNull(),
  imageUrl: text("image_url").notNull().default(""),
  unitPricePaise: integer("unit_price_paise").notNull(),
  quantity: integer("quantity").notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Raw audit log of every gateway callback / webhook we receive. */
export const paymentEvents = pgTable("payment_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  provider: varchar("provider", { length: 40 }).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  providerEventId: varchar("provider_event_id", { length: 120 }),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  recipient: varchar("recipient", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 240 }).notNull(),
  template: varchar("template", { length: 60 }).notNull(),
  /** "sent" | "skipped" (no SMTP configured) | "failed" */
  status: varchar("status", { length: 20 }).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  history: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
