const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Format paise (integer) as ₹ string. 49900 -> "₹499" */
export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}

/** Convert a rupee string/number from a form into integer paise. "499.50" -> 49950 */
export function rupeesToPaise(value: string | number): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function paiseToRupees(paise: number): string {
  return (paise / 100).toFixed(2);
}
