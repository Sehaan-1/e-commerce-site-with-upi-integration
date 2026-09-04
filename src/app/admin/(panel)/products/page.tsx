import Image from "next/image";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { formatPaise } from "@/lib/money";
import { deleteProductAction, quickUpdateStockAction, toggleProductActiveAction } from "../../actions";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const rows = await db.select().from(products).orderBy(asc(products.name));
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products <span className="text-base font-normal text-ink-500">({rows.length})</span></h1>
        <Link href="/admin/products/new" className="btn-primary !py-2.5">+ Add product</Link>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-sand-50 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Visible</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-900/10">
            {rows.map((p) => (
              <tr key={p.id} className="align-middle hover:bg-sand-50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                      <Image src={p.imageUrl || "/products/placeholder.svg"} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                    <div>
                      <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                      <p className="text-xs text-ink-500">/{p.slug}{p.featured ? " · featured" : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{p.category}</td>
                <td className="p-3 font-medium">{formatPaise(p.pricePaise)}{p.compareAtPaise ? <span className="ml-1 text-xs text-ink-500 line-through">{formatPaise(p.compareAtPaise)}</span> : null}</td>
                <td className="p-3">
                  <form action={quickUpdateStockAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="stock" type="number" min={0} defaultValue={p.stock} aria-label={`Stock for ${p.name}`} className={`w-20 rounded-lg border px-2 py-1.5 ${p.stock <= 5 ? "border-amber-400 bg-amber-50" : "border-ink-900/15"}`} />
                    <button type="submit" className="rounded-lg border border-ink-900/15 px-2 py-1.5 text-xs font-medium hover:bg-sand-100">Save</button>
                  </form>
                </td>
                <td className="p-3">
                  <form action={toggleProductActiveAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={p.active ? "false" : "true"} />
                    <button type="submit" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>
                      {p.active ? "Live" : "Hidden"}
                    </button>
                  </form>
                </td>
                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link href={`/admin/products/${p.id}`} className="rounded-lg border border-ink-900/15 px-2.5 py-1.5 text-xs font-medium hover:bg-sand-100">Edit</Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-500">Tip: hide a product instead of deleting it to keep past orders intact.</p>
    </>
  );
}
