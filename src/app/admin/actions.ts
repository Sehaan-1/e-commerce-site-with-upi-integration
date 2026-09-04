"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { products, type OrderStatus } from "@/db/schema";
import { checkPassword, createAdminSession, destroyAdminSession, requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/catalog";
import { logger } from "@/lib/logger";
import { rupeesToPaise } from "@/lib/money";
import { ADMIN_SELECTABLE_STATUSES } from "@/lib/order-status";
import { updateOrderStatus } from "@/lib/orders";

async function requestIdFromHeaders() {
  return (await headers()).get("x-request-id") || undefined;
}

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const requestId = await requestIdFromHeaders();
  const password = String(formData.get("password") || "");
  if (!checkPassword(password)) {
    logger.warn("admin.login.rejected", { requestId });
    return { error: "Incorrect password" };
  }
  await createAdminSession();
  logger.info("admin.login.ok", { requestId });
  redirect("/admin");
}

export async function logoutAction() {
  const requestId = await requestIdFromHeaders();
  await destroyAdminSession();
  logger.info("admin.logout", { requestId });
  redirect("/admin/login");
}

function productFromForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  return {
    name,
    slug: slugify(slugInput || name),
    category: String(formData.get("category") || "General").trim() || "General",
    description: String(formData.get("description") || "").trim(),
    pricePaise: rupeesToPaise(String(formData.get("price") || "0")),
    compareAtPaise: formData.get("compareAt") ? rupeesToPaise(String(formData.get("compareAt"))) || null : null,
    stock: Math.max(0, Math.floor(Number(formData.get("stock") || 0))),
    imageUrl: String(formData.get("imageUrl") || "").trim(),
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
  };
}

export type ProductFormState = { error?: string } | undefined;

export async function createProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const requestId = await requestIdFromHeaders();
  await requireAdmin();
  const data = productFromForm(formData);
  if (!data.name) return { error: "Name is required" };
  if (data.pricePaise <= 0) return { error: "Price must be greater than 0" };
  try {
    await db.insert(products).values(data);
    logger.info("admin.product.created", { requestId, slug: data.slug, active: data.active, featured: data.featured, stock: data.stock });
  } catch (e) {
    logger.error("admin.product.create_failed", { requestId, slug: data.slug }, e);
    return { error: e instanceof Error && e.message.includes("unique") ? "A product with this slug already exists" : "Could not save product" };
  }
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProductAction(id: number, _prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const requestId = await requestIdFromHeaders();
  await requireAdmin();
  const data = productFromForm(formData);
  if (!data.name) return { error: "Name is required" };
  if (data.pricePaise <= 0) return { error: "Price must be greater than 0" };
  try {
    await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
    logger.info("admin.product.updated", { requestId, id, slug: data.slug, active: data.active, featured: data.featured, stock: data.stock });
  } catch (e) {
    logger.error("admin.product.update_failed", { requestId, id, slug: data.slug }, e);
    return { error: e instanceof Error && e.message.includes("unique") ? "A product with this slug already exists" : "Could not save product" };
  }
  revalidatePath("/");
  redirect("/admin/products");
}

/** Inline stock edit from the products table. */
export async function quickUpdateStockAction(formData: FormData) {
  const requestId = await requestIdFromHeaders();
  await requireAdmin();
  const id = Number(formData.get("id"));
  const stock = Math.max(0, Math.floor(Number(formData.get("stock") || 0)));
  await db.update(products).set({ stock, updatedAt: new Date() }).where(eq(products.id, id));
  logger.info("admin.product.stock_updated", { requestId, id, stock });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleProductActiveAction(formData: FormData) {
  const requestId = await requestIdFromHeaders();
  await requireAdmin();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  await db.update(products).set({ active, updatedAt: new Date() }).where(eq(products.id, id));
  logger.info("admin.product.active_toggled", { requestId, id, active });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteProductAction(formData: FormData) {
  const requestId = await requestIdFromHeaders();
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(products).where(eq(products.id, id));
  logger.info("admin.product.deleted", { requestId, id });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateOrderStatusAction(formData: FormData) {
  const requestId = await requestIdFromHeaders();
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!ADMIN_SELECTABLE_STATUSES.includes(status)) throw new Error("Invalid status");
  const opts = {
    note: String(formData.get("note") || "").trim(),
    trackingCarrier: String(formData.get("trackingCarrier") || "").trim(),
    trackingNumber: String(formData.get("trackingNumber") || "").trim(),
    adminNote: String(formData.get("adminNote") || "").trim(),
    notify: formData.get("notify") === "on",
  };
  logger.info("admin.order_status.update", { requestId, orderId: id, status, notify: opts.notify });
  await updateOrderStatus(id, status, opts);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}
