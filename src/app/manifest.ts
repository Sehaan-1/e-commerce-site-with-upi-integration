import type { MetadataRoute } from "next";
import { STORE_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STORE_NAME,
    short_name: "Kalpa",
    description: "Handcrafted decor, kitchen and textile goods from Indian artisans. Pay with UPI.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#d97a2b",
    orientation: "portrait",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any" as const,
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable" as const,
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any" as const,
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable" as const,
      },
    ],
    screenshots: [],
  };
}
