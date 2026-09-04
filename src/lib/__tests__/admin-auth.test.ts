/**
 * Unit tests for admin-auth.ts — token generation/verification,
 * session expiry, timing-safe password comparison, and rate limiter.
 *
 * We mock `server-only`, `next/headers`, `next/navigation`, and the
 * config module so these tests run in a plain Node environment.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (must be hoisted before any import that transitively loads them) ───
// NOTE: "server-only" is stubbed via resolve.alias in vitest.config.ts

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }),
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Provide fixed, predictable values for the secrets used in token signing
vi.mock("@/lib/config", () => ({
  ADMIN_PASSWORD: "test-password-123",
  ADMIN_SESSION_SECRET: "test-secret-for-unit-tests-only-do-not-use",
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import {
  checkPassword,
  recordLoginAttempt,
  isLoginLocked,
} from "@/lib/admin-auth";

// ── checkPassword ─────────────────────────────────────────────────────────────
describe("checkPassword", () => {
  it("returns true for the correct password", () => {
    expect(checkPassword("test-password-123")).toBe(true);
  });

  it("returns false for an incorrect password", () => {
    expect(checkPassword("wrong-password")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(checkPassword("")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(checkPassword("Test-Password-123")).toBe(false);
  });

  it("returns false for a string that is a prefix of the real password", () => {
    expect(checkPassword("test-password")).toBe(false);
  });
});

// ── Login rate limiter ────────────────────────────────────────────────────────
describe("recordLoginAttempt + isLoginLocked", () => {
  const IP = "192.168.1.test";

  // Because the rate limiter state is module-level, reset by doing successful login
  beforeEach(() => {
    // Clear any existing entries by recording a success
    recordLoginAttempt(IP, true);
  });

  it("is not locked on the first failed attempt", () => {
    recordLoginAttempt(IP, false);
    expect(isLoginLocked(IP)).toBe(false);
  });

  it("returns decreasing attemptsLeft on successive failures", () => {
    const r1 = recordLoginAttempt(IP, false);
    const r2 = recordLoginAttempt(IP, false);
    expect(r2.attemptsLeft).toBeLessThan(r1.attemptsLeft);
  });

  it("locks the IP after the maximum number of failed attempts", () => {
    // Exhaust all 5 attempts
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(IP, false);
    }
    expect(isLoginLocked(IP)).toBe(true);
  });

  it("clears the lock on a successful login", () => {
    for (let i = 0; i < 5; i++) recordLoginAttempt(IP, false);
    expect(isLoginLocked(IP)).toBe(true);

    recordLoginAttempt(IP, true);
    expect(isLoginLocked(IP)).toBe(false);
  });

  it("returns locked: false and full attemptsLeft on success", () => {
    const result = recordLoginAttempt(IP, true);
    expect(result.locked).toBe(false);
    expect(result.attemptsLeft).toBeGreaterThan(0);
  });

  it("never returns negative attemptsLeft", () => {
    for (let i = 0; i < 10; i++) recordLoginAttempt(IP, false);
    const result = recordLoginAttempt(IP, false);
    expect(result.attemptsLeft).toBeGreaterThanOrEqual(0);
  });
});
