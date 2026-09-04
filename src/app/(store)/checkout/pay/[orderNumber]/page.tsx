import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { SandboxUpiPanel } from "@/components/checkout/sandbox-upi-panel";
import { MERCHANT_UPI_ID, STORE_NAME } from "@/lib/config";
import { formatPaise } from "@/lib/money";
import { getOrderByNumber } from "@/lib/orders";
import { sandboxToken } from "@/lib/payments/sandbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pay with UPI" };

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string }> };

export default async function SandboxPayPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t } = await searchParams;
  const order = await getOrderByNumber(orderNumber);
  if (!order || order.accessToken !== t) notFound();
  if (order.paymentStatus === "paid") redirect(`/orders/${order.orderNumber}?t=${order.accessToken}`);
  if (order.paymentProvider !== "upi_sandbox") redirect(`/orders/${order.orderNumber}?t=${order.accessToken}`);

  // Standard UPI deep link (NPCI spec). Real apps would open this; in sandbox we just display it.
  const upiUri = `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI_ID)}&pn=${encodeURIComponent(STORE_NAME)}&am=${(order.totalPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${order.orderNumber}`)}&tr=${encodeURIComponent(order.orderNumber)}`;
  const qrDataUrl = await QRCode.toDataURL(upiUri, { margin: 1, width: 240, color: { dark: "#1f1b16", light: "#ffffff" } });

  return (
    <div className="mx-auto max-w-xl py-8 sm:py-12">
      <div className="card overflow-hidden">
        <div className="bg-ink-900 p-5 text-white sm:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">UPI payment · sandbox</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/70">Paying {STORE_NAME}</p>
              <p className="text-3xl font-semibold">{formatPaise(order.totalPaise)}</p>
            </div>
            <p className="text-right text-xs text-white/70">Order<br /><span className="font-mono text-sm text-white">{order.orderNumber}</span></p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[240px_1fr] sm:p-6">
          <div className="mx-auto">
            <Image src={qrDataUrl} alt={`UPI QR code to pay ${formatPaise(order.totalPaise)}`} width={240} height={240} unoptimized className="rounded-xl border border-ink-900/10" />
            <p className="mt-2 text-center text-xs text-ink-500">Scan with any UPI app<br />{MERCHANT_UPI_ID}</p>
          </div>
          <SandboxUpiPanel orderNumber={order.orderNumber} token={sandboxToken(order)} accessToken={order.accessToken} upiUri={upiUri} />
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-500">
        This is the built-in UPI simulator — no money moves. Add Razorpay keys to <code>.env</code> to accept real UPI payments.
      </p>
    </div>
  );
}
