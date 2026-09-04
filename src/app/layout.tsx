import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { STORE_NAME, STORE_TAGLINE, getBaseUrl } from "@/lib/config";
import "./globals.css";

// ── Google Font ──────────────────────────────────────────────────────────────
// Inter is loaded via next/font — no external network request at render time,
// zero layout shift, font files are self-hosted by Next.js automatically.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// ── Root Metadata ────────────────────────────────────────────────────────────
const description =
  "Handcrafted decor, kitchen and textile goods from Indian artisans. Pay securely with UPI — GPay, PhonePe, Paytm & BHIM.";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),

  title: {
    default: `${STORE_NAME} — ${STORE_TAGLINE}`,
    template: `%s · ${STORE_NAME}`,
  },
  description,
  keywords: ["handcrafted", "Indian artisans", "home decor", "UPI payment", "ethnic home goods", "kalpa living"],

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: getBaseUrl(),
    siteName: STORE_NAME,
    title: `${STORE_NAME} — ${STORE_TAGLINE}`,
    description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${STORE_NAME} — handcrafted Indian goods`,
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: `${STORE_NAME} — ${STORE_TAGLINE}`,
    description,
    images: ["/og-image.jpg"],
  },

  // ── Icons & Manifest ───────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",

  // ── Indexing ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: getBaseUrl(),
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
};

// ── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* Preconnect to Google Fonts CDN and Razorpay for faster resource loading */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://api.razorpay.com" />
      </head>
      <body className="min-h-screen antialiased">
        {/* Skip-to-content for keyboard and screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
