import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ---------------------------------------------------------------------------
// Content-Security-Policy
// ---------------------------------------------------------------------------
// Adjust src values to match your actual CDNs / third-party scripts.
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + Next.js internals + Razorpay
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com"
    : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
  // Styles: self + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs + any HTTPS source (product images can come from anywhere)
  "img-src 'self' data: https:",
  // Frames: Razorpay checkout iframe
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  // Connections: self + Razorpay API + your own domain
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
  // Misc
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking protection
  { key: "X-Frame-Options", value: "DENY" },
  // Referrer policy — send origin only on cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features we don't need
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS — 1 year, include subdomains (only active in production over HTTPS)
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
  // CSP
  { key: "Content-Security-Policy", value: cspDirectives },
  // Don't advertise Next.js
  // (poweredByHeader: false below handles X-Powered-By)
];

const nextConfig: NextConfig = {
  // Remove X-Powered-By: Next.js header
  poweredByHeader: false,

  // Enable standalone output for Docker (Phase 6)
  output: "standalone",

  // Security headers on all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Allow next/image to load product images from common hosting providers.
  // Add more patterns here as needed.
  images: {
    remotePatterns: [
      // Google Drive / Workspace image exports
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Imgix
      { protocol: "https", hostname: "*.imgix.net" },
      // Unsplash (common for placeholder/demo images)
      { protocol: "https", hostname: "images.unsplash.com" },
      // Generic HTTPS (allows any HTTPS image — restrict in production if preferred)
      { protocol: "https", hostname: "**" },
    ],
    // Generate modern formats automatically
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
