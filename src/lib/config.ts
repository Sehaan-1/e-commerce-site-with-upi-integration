/**
 * Central place for every environment variable the app reads.
 * See SETUP.md for a plain-English explanation of each one.
 */

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Kalpa Living";
export const STORE_TAGLINE = "Thoughtfully made goods for Indian homes";
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@example.com";

/** Base URL used in emails and payment callbacks. */
export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

/** Free shipping above this amount (in paise). ₹999 by default. */
export const FREE_SHIPPING_THRESHOLD_PAISE = Number(process.env.FREE_SHIPPING_THRESHOLD_PAISE || 99900);
export const FLAT_SHIPPING_PAISE = Number(process.env.FLAT_SHIPPING_PAISE || 7900);

export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || "",
  keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  get configured() {
    return Boolean(this.keyId && this.keySecret);
  },
  /** Razorpay test keys start with rzp_test_, live keys with rzp_live_ */
  get isLive() {
    return this.keyId.startsWith("rzp_live_");
  },
};

/**
 * PAYMENT_MODE controls which UPI provider is active:
 *  - "auto"     (default) -> Razorpay if keys exist, otherwise the built-in sandbox
 *  - "razorpay" -> force Razorpay (errors if keys missing)
 *  - "sandbox"  -> force the built-in UPI simulator (never charges anyone)
 */
export const PAYMENT_MODE = (process.env.PAYMENT_MODE || "auto") as "auto" | "razorpay" | "sandbox";

/** Your UPI ID (VPA) — shown in the sandbox QR code. e.g. yourstore@upi */
export const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || "kalpaliving@upi";

export const smtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT || 587),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.EMAIL_FROM || `${STORE_NAME} <no-reply@example.com>`,
  get configured() {
    return Boolean(this.host);
  },
};

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
export const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "change-me-in-production-please-0123456789";
