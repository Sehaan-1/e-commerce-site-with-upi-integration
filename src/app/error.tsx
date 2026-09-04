"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void fetch("/api/observability/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: error.name,
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    }).catch(() => undefined);
  }, [error]);

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center animate-fade-in-up">
      <div className="mx-auto max-w-md">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-700">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>
        </span>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">We hit a snag</h1>
        <p className="mt-3 text-sm text-ink-700 sm:text-base">
          Please try again. If the problem continues, come back later.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-ink-500">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}

