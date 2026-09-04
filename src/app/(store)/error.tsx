"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
    <main id="main-content" className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center animate-fade-in-up">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Store error</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-sm text-ink-700 sm:text-base">
          Please go back to the shop and try again.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn-secondary">
            Retry
          </button>
          <Link href="/#shop" className="btn-primary">
            Back to shop
          </Link>
        </div>
      </div>
    </main>
  );
}

