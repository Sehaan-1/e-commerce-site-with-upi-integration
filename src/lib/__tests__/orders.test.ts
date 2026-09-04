/**
 * Unit tests for orders.ts — pure/isolated functions only.
 *
 * `computeShipping` and `validate` (the internal fn) are tested here via their
 * exported counterpart.  We avoid importing anything that touches the database
 * or the Next.js runtime by mocking those modules at the top of the file.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock database & server-only modules BEFORE any lib imports ───────────────
// NOTE: "server-only" is stubbed via resolve.alias in vitest.config.ts

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => []) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => Promise.resolve()) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}));

vi.mock("@/db/schema", () => ({
  orders: {},
  orderItems: {},
  orderStatusHistory: {},
  paymentEvents: {},
  products: {},
}));

vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn(() => Promise.resolve()),
  sendOrderStatusEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/payments", () => ({
  getActiveUpiProvider: vi.fn(() => ({
    id: "sandbox",
    createPayment: vi.fn(() =>
      Promise.resolve({ clientAction: { type: "redirect", url: "/pay" } }),
    ),
  })),
  getProvider: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  sql: vi.fn(),
}));

// ── Now import the module under test ─────────────────────────────────────────
import { computeShipping, CheckoutError } from "@/lib/orders";

// ── computeShipping ───────────────────────────────────────────────────────────
describe("computeShipping", () => {
  const FREE_THRESHOLD = 99900; // ₹999 in paise (default from config)
  const FLAT_SHIPPING = 7900;   // ₹79 in paise (default from config)

  it("charges flat shipping when subtotal is below the free-shipping threshold", () => {
    expect(computeShipping(50000)).toBe(FLAT_SHIPPING); // ₹500 → pay shipping
  });

  it("returns 0 when subtotal exactly meets the free-shipping threshold", () => {
    expect(computeShipping(FREE_THRESHOLD)).toBe(0);
  });

  it("returns 0 when subtotal exceeds the free-shipping threshold", () => {
    expect(computeShipping(200000)).toBe(0); // ₹2000 → free shipping
  });

  it("returns flat shipping for a single-paise subtotal", () => {
    expect(computeShipping(1)).toBe(FLAT_SHIPPING);
  });

  it("returns flat shipping for a zero subtotal", () => {
    expect(computeShipping(0)).toBe(FLAT_SHIPPING);
  });

  it("returns flat shipping just one paise below the threshold", () => {
    expect(computeShipping(FREE_THRESHOLD - 1)).toBe(FLAT_SHIPPING);
  });
});

// ── CheckoutError ─────────────────────────────────────────────────────────────
describe("CheckoutError", () => {
  it("defaults to HTTP 400", () => {
    const err = new CheckoutError("bad input");
    expect(err.status).toBe(400);
    expect(err.message).toBe("bad input");
  });

  it("accepts a custom status code", () => {
    const err = new CheckoutError("not found", 404);
    expect(err.status).toBe(404);
  });

  it("is an instance of Error", () => {
    expect(new CheckoutError("x")).toBeInstanceOf(Error);
  });
});
