/**
 * Unit tests for config.ts — verifies env-var reading, defaults,
 * and Razorpay isLive detection.
 *
 * We manipulate `process.env` before each test and restore it after
 * to avoid cross-test pollution.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Capture original env so we can restore it
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  // Restore all env vars
  Object.keys(process.env).forEach((k) => {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  });
  Object.assign(process.env, ORIGINAL_ENV);
  // Clear the module registry so re-imports pick up updated env
  vi.resetModules();
});

describe("config defaults", () => {
  it("uses 'Kalpa Living' as the default store name", async () => {
    delete process.env.NEXT_PUBLIC_STORE_NAME;
    const { STORE_NAME } = await import("@/lib/config");
    expect(STORE_NAME).toBe("Kalpa Living");
  });

  it("uses localhost:3000 as the default base URL", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.VERCEL_URL;
    const { getBaseUrl } = await import("@/lib/config");
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("prefers NEXT_PUBLIC_BASE_URL when set", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://my-store.com";
    const { getBaseUrl } = await import("@/lib/config");
    expect(getBaseUrl()).toBe("https://my-store.com");
  });

  it("uses VERCEL_URL when NEXT_PUBLIC_BASE_URL is absent", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.VERCEL_URL = "my-store.vercel.app";
    const { getBaseUrl } = await import("@/lib/config");
    expect(getBaseUrl()).toBe("https://my-store.vercel.app");
  });

  it("has default shipping thresholds in paise", async () => {
    delete process.env.FREE_SHIPPING_THRESHOLD_PAISE;
    delete process.env.FLAT_SHIPPING_PAISE;
    const { FREE_SHIPPING_THRESHOLD_PAISE, FLAT_SHIPPING_PAISE } = await import("@/lib/config");
    expect(FREE_SHIPPING_THRESHOLD_PAISE).toBe(99900); // ₹999
    expect(FLAT_SHIPPING_PAISE).toBe(7900);            // ₹79
  });

  it("uses 'auto' as the default PAYMENT_MODE", async () => {
    delete process.env.PAYMENT_MODE;
    const { PAYMENT_MODE } = await import("@/lib/config");
    expect(PAYMENT_MODE).toBe("auto");
  });
});

describe("razorpayConfig.isLive", () => {
  it("returns false when key starts with rzp_test_", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_abc123";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const { razorpayConfig } = await import("@/lib/config");
    expect(razorpayConfig.isLive).toBe(false);
  });

  it("returns true when key starts with rzp_live_", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_live_abc123";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const { razorpayConfig } = await import("@/lib/config");
    expect(razorpayConfig.isLive).toBe(true);
  });

  it("returns false when key is empty", async () => {
    process.env.RAZORPAY_KEY_ID = "";
    const { razorpayConfig } = await import("@/lib/config");
    expect(razorpayConfig.isLive).toBe(false);
  });
});

describe("razorpayConfig.configured", () => {
  it("returns false when both keys are empty", async () => {
    process.env.RAZORPAY_KEY_ID = "";
    process.env.RAZORPAY_KEY_SECRET = "";
    const { razorpayConfig } = await import("@/lib/config");
    expect(razorpayConfig.configured).toBe(false);
  });

  it("returns true when both keys are non-empty", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_abc";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const { razorpayConfig } = await import("@/lib/config");
    expect(razorpayConfig.configured).toBe(true);
  });

  it("returns false when only one key is set", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_abc";
    process.env.RAZORPAY_KEY_SECRET = "";
    const { razorpayConfig } = await import("@/lib/config");
    expect(razorpayConfig.configured).toBe(false);
  });
});

describe("smtpConfig.configured", () => {
  it("returns false when SMTP_HOST is empty", async () => {
    process.env.SMTP_HOST = "";
    const { smtpConfig } = await import("@/lib/config");
    expect(smtpConfig.configured).toBe(false);
  });

  it("returns true when SMTP_HOST is set", async () => {
    process.env.SMTP_HOST = "smtp.gmail.com";
    const { smtpConfig } = await import("@/lib/config");
    expect(smtpConfig.configured).toBe(true);
  });
});
