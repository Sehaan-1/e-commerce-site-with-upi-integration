import { PAYMENT_MODE, getBaseUrl, razorpayConfig, smtpConfig } from "@/lib/config";
import { describeProviders } from "@/lib/payments";

export const metadata = { title: "Settings" };

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-900/10 py-2.5 text-sm last:border-0">
      <dt className="text-ink-700">{label}</dt>
      <dd className={`text-right font-medium ${ok === undefined ? "" : ok ? "text-emerald-700" : "text-amber-700"}`}>{value}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const providers = describeProviders();
  const webhookUrl = `${getBaseUrl()}/api/payments/razorpay/webhook`;
  return (
    <>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Everything here is controlled by the <code>.env</code> file — see <code>SETUP.md</code>. Restart the app after changing it.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Payments</h2>
          <dl className="mt-2">
            <Row label="PAYMENT_MODE" value={PAYMENT_MODE} />
            <Row label="Razorpay keys" value={razorpayConfig.configured ? (razorpayConfig.isLive ? "Live keys set" : "Test keys set") : "Not set (sandbox simulator active)"} ok={razorpayConfig.configured} />
            <Row label="Razorpay webhook secret" value={razorpayConfig.webhookSecret ? "Set" : "Not set"} ok={Boolean(razorpayConfig.webhookSecret)} />
          </dl>
          <p className="mt-3 text-xs text-ink-500">Webhook URL to paste into Razorpay Dashboard → Settings → Webhooks:</p>
          <code className="mt-1 block break-all rounded-lg bg-sand-100 p-2 text-xs">{webhookUrl}</code>

          <h3 className="mt-5 text-sm font-semibold">Gateway registry</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {providers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span>{p.displayName} <span className="font-mono text-xs text-ink-500">{p.id}</span></span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.active ? "bg-emerald-100 text-emerald-800" : p.configured ? "bg-sky-100 text-sky-800" : "bg-stone-200 text-stone-700"}`}>
                  {p.active ? `active · ${p.mode}` : p.configured ? "configured" : "not enabled"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Email</h2>
          <dl className="mt-2">
            <Row label="SMTP host" value={smtpConfig.configured ? smtpConfig.host : "Not set — emails are logged, not sent"} ok={smtpConfig.configured} />
            <Row label="From address" value={smtpConfig.from} />
          </dl>
          <p className="mt-3 text-xs text-ink-500">Works with any SMTP provider: Gmail app passwords, Zoho, Brevo, Amazon SES, Resend SMTP, etc.</p>

          <h2 className="mt-6 font-semibold">Store</h2>
          <dl className="mt-2">
            <Row label="Base URL (used in email links)" value={getBaseUrl()} />
            <Row label="Admin password" value={process.env.ADMIN_PASSWORD ? "Custom" : "Default (change it!)"} ok={Boolean(process.env.ADMIN_PASSWORD)} />
          </dl>
        </section>
      </div>
    </>
  );
}
