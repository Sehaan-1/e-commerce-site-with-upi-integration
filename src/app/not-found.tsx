import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { listActiveProducts } from "@/lib/catalog";

export default async function NotFound() {
  const categories = [
    { name: "Decor", href: "/?category=Decor#shop" },
    { name: "Kitchen", href: "/?category=Kitchen#shop" },
    { name: "Textiles", href: "/?category=Textiles#shop" },
    { name: "Storage", href: "/?category=Storage#shop" },
  ];

  let featured = [] as Awaited<ReturnType<typeof listActiveProducts>>;
  try {
    featured = (await listActiveProducts()).slice(0, 4);
  } catch {
    featured = [];
  }

  return (
    <main id="main-content" className="min-h-screen px-4 py-16 animate-fade-in-up">
      <div className="mx-auto max-w-md text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-500/10 text-saffron-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-saffron-600">404 · Page Not Found</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-sm text-ink-700 sm:text-base">
          The piece you were looking for might have moved, or the link may have expired.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Explore the collection
          </Link>
          <Link href="/track" className="btn-secondary">
            Track an order
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-ink-900/10 bg-white/60 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Popular Categories</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={c.href}
                className="rounded-full bg-sand-100 px-3.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-900 hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {featured.length > 0 ? (
        <section className="mx-auto mt-14 max-w-5xl">
          <h2 className="text-center text-lg font-semibold tracking-tight text-ink-900">Popular right now</h2>
          <p className="mt-2 text-center text-sm text-ink-600">A few customer favorites to get you back on track.</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
