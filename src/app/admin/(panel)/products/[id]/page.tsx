import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { updateProductAction } from "../../../actions";
import { ProductForm } from "../product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, Number(id)));
  if (!product) notFound();
  const action = updateProductAction.bind(null, product.id);
  return (
    <>
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <p className="mt-1 text-sm text-ink-500">Changes go live on the storefront immediately.</p>
      <div className="mt-6">
        <ProductForm product={product} action={action} />
      </div>
    </>
  );
}
