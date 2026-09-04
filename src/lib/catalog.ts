import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, type NewProduct } from "@/db/schema";

export const SEED_PRODUCTS: NewProduct[] = [
  {
    slug: "brass-diya-set-of-two",
    name: "Hand-polished Brass Diya (Set of 2)",
    category: "Decor",
    description:
      "Traditional brass diyas, hand-polished in Moradabad. Heavy-gauge brass that stays warm-toned for years. Perfect for the puja shelf, Diwali evenings or a quiet dinner table.",
    pricePaise: 89900,
    compareAtPaise: 119900,
    stock: 40,
    imageUrl: "/products/brass-diya.jpg",
    featured: true,
  },
  {
    slug: "speckled-stoneware-mugs",
    name: "Speckled Stoneware Mugs (Pair)",
    category: "Kitchen",
    description:
      "Wheel-thrown stoneware mugs in terracotta and sage. 300 ml, microwave and dishwasher safe. Each pair has slight variations — that's the point.",
    pricePaise: 129900,
    stock: 25,
    imageUrl: "/products/ceramic-mugs.jpg",
    featured: true,
  },
  {
    slug: "indigo-handwoven-cotton-throw",
    name: "Indigo Handwoven Cotton Throw",
    category: "Textiles",
    description:
      "100% cotton throw woven on a handloom in Bhuj, dyed with natural indigo. 130 × 180 cm. Gets softer with every wash.",
    pricePaise: 249900,
    compareAtPaise: 299900,
    stock: 15,
    imageUrl: "/products/cotton-throw.jpg",
    featured: true,
  },
  {
    slug: "jute-storage-basket",
    name: "Woven Jute Storage Basket",
    category: "Storage",
    description:
      "Chunky hand-braided jute basket with vegetable-tanned leather handles. 35 cm wide. Holds blankets, toys, laundry, or your ever-growing plant collection.",
    pricePaise: 149900,
    stock: 30,
    imageUrl: "/products/jute-basket.jpg",
  },
  {
    slug: "sandalwood-jasmine-soy-candle",
    name: "Sandalwood & Jasmine Soy Candle",
    category: "Decor",
    description:
      "Hand-poured soy wax candle with a cotton wick and a 45-hour burn time. Notes of Mysore sandalwood, night jasmine and a hint of cardamom.",
    pricePaise: 69900,
    stock: 60,
    imageUrl: "/products/soy-candle.jpg",
    featured: true,
  },
  {
    slug: "jaipur-block-print-cushion-cover",
    name: "Jaipur Block-print Cushion Cover",
    category: "Textiles",
    description:
      "Hand block-printed in Sanganer using carved teak blocks and azo-free dyes. 40 × 40 cm, hidden zip, cover only.",
    pricePaise: 59900,
    stock: 45,
    imageUrl: "/products/block-print-cushion.jpg",
  },
  {
    slug: "hammered-copper-water-bottle",
    name: "Hammered Copper Water Bottle · 1L",
    category: "Kitchen",
    description:
      "Pure copper bottle with a leak-proof cap and a hammered matte finish. Lacquer-free inside, so it works the way your grandmother's tamba lota did.",
    pricePaise: 109900,
    stock: 35,
    imageUrl: "/products/copper-bottle.jpg",
  },
  {
    slug: "mango-wood-serving-tray",
    name: "Round Mango Wood Serving Tray",
    category: "Kitchen",
    description:
      "Solid mango wood tray with solid brass handles, finished in food-safe oil. 30 cm diameter — ideal for chai for two.",
    pricePaise: 169900,
    stock: 20,
    imageUrl: "/products/mango-wood-tray.jpg",
  },
];

/** Seeds the catalogue the first time the store runs on an empty database. */
export async function ensureSeeded() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
  if (count > 0) return false;
  await db.insert(products).values(SEED_PRODUCTS).onConflictDoNothing();
  return true;
}

export async function listActiveProducts(category?: string) {
  const where = category ? and(eq(products.active, true), eq(products.category, category)) : eq(products.active, true);
  return db.select().from(products).where(where).orderBy(desc(products.featured), asc(products.name));
}

export async function listCategories() {
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.category));
  return rows.map((r) => r.category);
}

export async function getProductBySlug(slug: string) {
  const [p] = await db.select().from(products).where(eq(products.slug, slug));
  return p ?? null;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}
