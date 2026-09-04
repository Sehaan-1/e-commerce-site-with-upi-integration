import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ensureSeeded, listActiveProducts, listCategories } from "@/lib/catalog";
import { STORE_NAME, STORE_TAGLINE, getBaseUrl } from "@/lib/config";


export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  await ensureSeeded();
  const [items, categories] = await Promise.all([listActiveProducts(category), listCategories()]);

  const baseUrl = getBaseUrl();

  // JSON-LD: WebSite (enables Google Sitelinks Searchbox)
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: STORE_NAME,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${baseUrl}/?category={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  // JSON-LD: Organization (enables Google Knowledge Panel)
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: STORE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512.png`,
    description: "Handcrafted decor, kitchen and textile goods from Indian artisans. Pay with UPI.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Hindi"],
    },
  };

  // JSON-LD: ItemList for product grid
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category ? `${category} — ${STORE_NAME}` : `All Products — ${STORE_NAME}`,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/products/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <section className="grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron-600">Handmade in India</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{STORE_TAGLINE}</h1>
          <p className="mt-5 max-w-xl text-base text-ink-700 sm:text-lg">
            Brass, stoneware, handloom and block-print pieces from small workshops — delivered to your door. Pay in seconds with any UPI app.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#shop" className="btn-primary">Shop the collection</a>
            <Link href="/track" className="btn-secondary">Track an order</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
            <li>✓ Free shipping over ₹999</li>
            <li>✓ UPI · GPay · PhonePe · BHIM</li>
            <li>✓ 7-day easy returns</li>
          </ul>
        </div>
        <div className="hidden rounded-3xl bg-gradient-to-br from-sand-200 via-sand-100 to-saffron-500/20 p-8 lg:block">
          <blockquote className="text-2xl font-medium leading-snug text-ink-900">
            “Every piece carries the hand of the person who made it.”
          </blockquote>
          <p className="mt-4 text-sm text-ink-500">— our founding note, 2021</p>
        </div>
      </section>

      <section id="shop" className="scroll-mt-20 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{category ? category : "All products"}</h2>
          <nav aria-label="Categories" className="flex flex-wrap gap-2">
            <Link href="/#shop" className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${!category ? "bg-ink-900 text-white" : "bg-white text-ink-700 hover:bg-sand-100"}`}>
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/?category=${encodeURIComponent(c)}#shop`}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${category === c ? "bg-ink-900 text-white" : "bg-white text-ink-700 hover:bg-sand-100"}`}
              >
                {c}
              </Link>
            ))}
          </nav>
        </div>

        {items.length === 0 ? (
          <p className="mt-10 text-ink-500">No products in this category yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
