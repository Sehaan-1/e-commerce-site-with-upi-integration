import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { FLAT_SHIPPING_PAISE, FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/config";
import { getActiveUpiProvider } from "@/lib/payments";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const provider = getActiveUpiProvider();
  return (
    <div className="py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-1 text-ink-500">Secure UPI payment · takes under a minute</p>
      <div className="mt-8">
        <CheckoutForm
          freeShippingThresholdPaise={FREE_SHIPPING_THRESHOLD_PAISE}
          flatShippingPaise={FLAT_SHIPPING_PAISE}
          providerLabel={provider.id === "upi_sandbox" ? "Sandbox" : provider.mode === "live" ? "Secured by Razorpay" : "Razorpay test mode"}
          isTestMode={provider.mode === "test"}
        />
      </div>
    </div>
  );
}
