import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/db/schema";
import { formatPaise } from "@/lib/money";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const soldOut = product.stock <= 0;
  return (
    <Link href={`/products/${product.slug}`} className="card product-card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-sand-100">
        <Image
          src={product.imageUrl || "/products/placeholder.svg"}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
          <span className="absolute left-3 top-3 rounded-full bg-saffron-500 px-2.5 py-1 text-xs font-bold text-white">
            {Math.round((1 - product.pricePaise / product.compareAtPaise) * 100)}% off
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-900/80 py-1.5 text-center text-xs font-semibold text-white">Sold out</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wider text-ink-500">{product.category}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
        <p className="mt-auto pt-3 text-base font-semibold">
          {formatPaise(product.pricePaise)}
          {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
            <span className="ml-2 text-sm font-normal text-ink-500 line-through">{formatPaise(product.compareAtPaise)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
