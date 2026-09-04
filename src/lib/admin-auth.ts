import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_PASSWORD, ADMIN_SESSION_SECRET } from "./config";
import { logger } from "./logger";

const COOKIE_NAME = "kl_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ── Startup guard: warn loudly if default credentials are used in production ─
if (process.env.NODE_ENV === "production") {
  if (ADMIN_PASSWORD === "admin123" || ADMIN_PASSWORD === "change-me") {
    logger.error(
      "[SECURITY] ADMIN_PASSWORD is set to the default value. Change it immediately via the ADMIN_PASSWORD environment variable.",
    );
  }
  if (ADMIN_SESSION_SECRET.startsWith("change-me")) {
    logger.error("[SECURITY] ADMIN_SESSION_SECRET is set to the default value. Generate a strong secret.");
  }
}

// ── Login attempt rate limiter (in-memory, per-IP) ───────────────────────────
// For multi-instance deployments, replace with a Redis-backed store.
interface LoginAttempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15-minute lockout

const loginAttempts = new Map<string, LoginAttempt>();

export function recordLoginAttempt(ip: string, success: boolean): { locked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (success) {
    loginAttempts.delete(ip);
    return { locked: false, attemptsLeft: LOGIN_MAX_ATTEMPTS };
  }

  if (!entry || now - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: now });
    return { locked: false, attemptsLeft: LOGIN_MAX_ATTEMPTS - 1 };
  }

  entry.count += 1;
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOGIN_LOCKOUT_MS;
    logger.warn("[AUTH] IP locked out after failed login attempts", { ip, failedAttempts: entry.count });
  }

  return {
    locked: Boolean(entry.lockedUntil && now < entry.lockedUntil),
    attemptsLeft: Math.max(0, LOGIN_MAX_ATTEMPTS - entry.count),
  };
}

export function isLoginLocked(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry?.lockedUntil) return false;
  if (now >= entry.lockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  return true;
}

function sign(payload: string) {
  return createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("hex");
}

function makeToken() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  const payload = `${role}.${exp}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(exp) > Math.floor(Date.now() / 1000);
}

export function checkPassword(password: string) {
  const a = Buffer.from(password);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    // strict in production — cookie is never sent cross-site
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin", // scope cookie to admin routes only
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

/** Call at the top of every admin page / server action. Redirects to login when not signed in. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
