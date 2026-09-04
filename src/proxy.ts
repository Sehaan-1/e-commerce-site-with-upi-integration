import { type NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per-IP, resets on cold start).
// For production at scale, replace with an Upstash Redis store.
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max checkout attempts per window

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// ---------------------------------------------------------------------------
// Proxy (Next.js 16 — previously "middleware")
// ---------------------------------------------------------------------------
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // ── 1. Admin route protection ──────────────────────────────────────────────
  // Every /admin/** path except /admin/login requires the kl_admin cookie.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("kl_admin")?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("x-request-id", requestId);
      return res;
    }
  }

  // ── 2. CSRF protection on mutating API calls ───────────────────────────────
  // Browsers always send Origin on cross-origin requests; absent = same-origin fetch.
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          const res = NextResponse.json({ error: "Forbidden: cross-origin request" }, { status: 403 });
          res.headers.set("x-request-id", requestId);
          return res;
        }
      } catch {
        // Malformed origin header — block it
        const res = NextResponse.json({ error: "Forbidden" }, { status: 403 });
        res.headers.set("x-request-id", requestId);
        return res;
      }
    }
  }

  // ── 3. Checkout rate limiting ──────────────────────────────────────────────
  if (pathname === "/api/checkout" && method === "POST") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      const res = NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          },
        },
      );
      res.headers.set("x-request-id", requestId);
      return res;
    }
  }

  // ── 4. Bot protection on checkout page ─────────────────────────────────────
  // Block obviously headless/scripted requests that lack a user-agent.
  if (pathname.startsWith("/checkout")) {
    const ua = request.headers.get("user-agent") || "";
    if (!ua || ua === "node-fetch" || ua === "python-requests") {
      const res = NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
      res.headers.set("x-request-id", requestId);
      return res;
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-request-id", requestId);
  return res;
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
