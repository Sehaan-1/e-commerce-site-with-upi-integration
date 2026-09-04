import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { FLAT_SHIPPING_PAISE, FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/config";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
      <CartView freeShippingThresholdPaise={FREE_SHIPPING_THRESHOLD_PAISE} flatShippingPaise={FLAT_SHIPPING_PAISE} />
    </div>
  );
}
