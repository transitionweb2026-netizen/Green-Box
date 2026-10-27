import { notFound } from "next/navigation";
import { adminGetCategory, adminListProducts } from "@/lib/services/catalog";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryProductsManager } from "@/components/admin/category-products-manager";
import { updateCategoryAction } from "../../actions";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await adminGetCategory(id);
  if (!category) notFound();

  const [{ products: categoryProducts }, { products: allProducts }] = await Promise.all([
    adminListProducts({ categoryId: id, pageSize: 500 }),
    adminListProducts({ pageSize: 500 }),
  ]);
  const otherProducts = allProducts.filter((product) => product.category_id !== id && product.product_type === "standard");

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">تعديل القسم</h1>
      <div className="mt-6 max-w-lg space-y-10">
        <CategoryForm category={category} action={updateCategoryAction.bind(null, id)} />
        <CategoryProductsManager categoryId={id} categoryProducts={categoryProducts} otherProducts={otherProducts} />
      </div>
    </div>
  );
}
