"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Product } from "@/db/schema";
import { paiseToRupees } from "@/lib/money";
import type { ProductFormState } from "../../actions";

interface Props {
  product?: Product;
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
}

export function ProductForm({ product, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card space-y-4 p-5 sm:p-6">
        <div>
          <label htmlFor="name" className="label">Product name</label>
          <input id="name" name="name" required defaultValue={product?.name} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="slug" className="label">URL slug <span className="text-ink-500">(auto from name if blank)</span></label>
            <input id="slug" name="slug" defaultValue={product?.slug} placeholder="brass-diya-set" className="input font-mono text-sm" />
          </div>
          <div>
            <label htmlFor="category" className="label">Category</label>
            <input id="category" name="category" list="categories" defaultValue={product?.category ?? ""} placeholder="Decor" className="input" />
            <datalist id="categories"><option>Decor</option><option>Kitchen</option><option>Textiles</option><option>Storage</option></datalist>
          </div>
        </div>
        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" rows={6} defaultValue={product?.description} className="input" />
        </div>
        <div>
          <label htmlFor="imageUrl" className="label">Image URL</label>
          <input id="imageUrl" name="imageUrl" defaultValue={product?.imageUrl} placeholder="/products/my-photo.jpg or https://…" className="input" />
          <p className="mt-1 text-xs text-ink-500">Drop image files into <code>public/products/</code> and reference them as <code>/products/filename.jpg</code>, or paste any https image link.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="price" className="label">Price (₹)</label>
              <input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={product ? paiseToRupees(product.pricePaise) : ""} className="input" />
            </div>
            <div>
              <label htmlFor="compareAt" className="label">Was price (₹)</label>
              <input id="compareAt" name="compareAt" type="number" step="0.01" min="0" defaultValue={product?.compareAtPaise ? paiseToRupees(product.compareAtPaise) : ""} className="input" />
            </div>
          </div>
          <div>
            <label htmlFor="stock" className="label">Stock on hand</label>
            <input id="stock" name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="h-4 w-4" /> Visible in store</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="h-4 w-4" /> Featured (shown first)</label>
        </div>
        {state?.error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn-primary flex-1">{pending ? "Saving…" : product ? "Save changes" : "Create product"}</button>
          <Link href="/admin/products" className="btn-secondary">Cancel</Link>
        </div>
      </div>
    </form>
  );
}
