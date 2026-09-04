import Link from "next/link";
import { STORE_NAME, SUPPORT_EMAIL } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink-900/10 bg-sand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-lg font-semibold">{STORE_NAME}</p>
          <p className="mt-2 text-sm text-ink-500">Thoughtfully made goods for Indian homes. Ships across India in 3–7 days.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Help</p>
          <ul className="mt-2 space-y-1.5 text-ink-700">
            <li><Link href="/track" className="hover:underline">Track your order</Link></li>
            <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">{SUPPORT_EMAIL}</a></li>
            <li><Link href="/admin" className="hover:underline">Store admin</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Payments</p>
          <p className="mt-2 text-ink-700">We accept UPI — Google Pay, PhonePe, Paytm, BHIM and every other UPI app. No card needed.</p>
        </div>
      </div>
      <div className="border-t border-ink-900/10 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {STORE_NAME}. All prices include GST.
      </div>
    </footer>
  );
}
