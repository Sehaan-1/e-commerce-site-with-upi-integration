import { createProductAction } from "../../../actions";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Add product</h1>
      <div className="mt-6">
        <ProductForm action={createProductAction} />
      </div>
    </>
  );
}
