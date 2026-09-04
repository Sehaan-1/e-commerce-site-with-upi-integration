"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";

const APPS = [
  { id: "Google Pay", color: "bg-[#1a73e8]", short: "G" },
  { id: "PhonePe", color: "bg-[#5f259f]", short: "पे" },
  { id: "Paytm", color: "bg-[#00b9f1]", short: "P" },
  { id: "BHIM", color: "bg-[#0a6e4e]", short: "B" },
];

interface Props {
  orderNumber: string;
  token: string;
  accessToken: string;
  upiUri: string;
}

export function SandboxUpiPanel({ orderNumber, token, accessToken, upiUri }: Props) {
  const router = useRouter();
  const { clear } = useCart();
  const [app, setApp] = useState<string>(APPS[0].id);
  const [phase, setPhase] = useState<"idle" | "waiting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function complete(outcome: "success" | "failure") {
    setError(null);
    setPhase("waiting");
    try {
      const res = await fetch("/api/payments/sandbox/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, token, outcome, app }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (outcome === "success") {
        if (!res.ok || !data.ok) throw new Error(data.error || "Payment could not be confirmed");
        clear();
        setPhase("done");
        router.push(`/orders/${orderNumber}?t=${accessToken}&new=1`);
      } else {
        setPhase("idle");
        setError("Payment declined (simulated). You can retry with a different app.");
      }
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold">Or pay with an app</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {APPS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setApp(a.id)}
            aria-pressed={app === a.id}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] font-medium transition ${app === a.id ? "border-ink-900 bg-sand-50" : "border-ink-900/10 hover:border-ink-900/40"}`}
          >
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${a.color}`} aria-hidden>{a.short}</span>
            {a.id}
          </button>
        ))}
      </div>

      <a href={upiUri} className="mt-4 block truncate rounded-lg bg-sand-100 px-3 py-2 font-mono text-[11px] text-ink-700" title="UPI intent link">
        {upiUri}
      </a>

      <div className="mt-5 rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3">
        <p className="text-xs font-semibold text-amber-900">Sandbox controls — simulate the {app} response</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => complete("success")} disabled={phase !== "idle"} className="btn-primary flex-1 !py-2.5">
            {phase === "waiting" ? "Confirming…" : phase === "done" ? "Paid ✓" : "Approve payment"}
          </button>
          <button type="button" onClick={() => complete("failure")} disabled={phase !== "idle"} className="btn-secondary !py-2.5">
            Decline
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <p className="mt-3 text-xs text-ink-500">With live Razorpay keys, this step is replaced by the real UPI app on the customer&apos;s phone.</p>
    </div>
  );
}
