import type { MetadataRoute } from "next";
import { listActiveProducts } from "@/lib/catalog";
import { getBaseUrl } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Fetch all active products for dynamic product URLs
  let products: { slug: string; updatedAt: Date | null }[] = [];
  try {
    products = await listActiveProducts();
  } catch {
    // If DB is not available during build, return static pages only
    products = [];
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
