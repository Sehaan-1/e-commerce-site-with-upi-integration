import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { getProductBySlug, listActiveProducts } from "@/lib/catalog";
import { formatPaise } from "@/lib/money";
import { getBaseUrl } from "@/lib/config";


export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const baseUrl = getBaseUrl();
  const description = product.description.slice(0, 155);
  const imageUrl = product.imageUrl || `${baseUrl}/og-image.jpg`;

  return {
    title: product.name,
    description,
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: [{ url: imageUrl, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/products/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();
  const related = (await listActiveProducts(product.category)).filter((p) => p.id !== product.id).slice(0, 4);

  // JSON-LD structured data for Google rich results
  const baseUrl = getBaseUrl();
  const pricePaise = product.pricePaise;
  const priceINR = (pricePaise / 100).toFixed(2);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl || `${baseUrl}/og-image.jpg`,
    url: `${baseUrl}/products/${product.slug}`,
    brand: { "@type": "Brand", name: "Kalpa Living" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: priceINR,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${baseUrl}/products/${product.slug}`,
      seller: { "@type": "Organization", name: "Kalpa Living" },
    },
  };

  return (
    <>
      {/* Inject JSON-LD into <head> */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="py-4 text-sm text-ink-500">
        <Link href="/" className="hover:underline">Home</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/?category=${encodeURIComponent(product.category)}#shop`} className="hover:underline">{product.category}</Link>{" "}
        <span aria-hidden>/</span> <span className="text-ink-900">{product.name}</span>
      </nav>

      <article className="grid gap-8 pb-12 lg:grid-cols-2 lg:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand-100">
          <Image src={product.imageUrl || "/products/placeholder.svg"} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="lg:py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron-600">{product.category}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold">
            {formatPaise(product.pricePaise)}
            {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
              <span className="ml-3 text-base font-normal text-ink-500 line-through">{formatPaise(product.compareAtPaise)}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-500">Inclusive of all taxes</p>
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-ink-700">{product.description}</p>

          <p className="mt-6 text-sm font-medium">
            {product.stock <= 0 ? (
              <span className="text-rose-700">Currently sold out</span>
            ) : product.stock <= 5 ? (
              <span className="text-saffron-600">Only {product.stock} left</span>
            ) : (
              <span className="text-emerald-700">In stock · ships in 1–2 days</span>
            )}
          </p>
          <div className="mt-5">
            <AddToCartButton product={product} />
          </div>

          <ul className="mt-8 grid gap-2 text-sm text-ink-700 sm:grid-cols-2">
            <li className="rounded-xl bg-white p-3">💸 Pay with UPI — GPay, PhonePe, Paytm, BHIM</li>
            <li className="rounded-xl bg-white p-3">🚚 Free shipping on orders over ₹999</li>
            <li className="rounded-xl bg-white p-3">↩️ 7-day hassle-free returns</li>
            <li className="rounded-xl bg-white p-3">📦 Tracked delivery across India</li>
          </ul>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-ink-900/10 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">More from {product.category}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
