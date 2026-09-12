import { adminListCategories } from "@/lib/services/catalog";
import { ProductForm } from "@/components/admin/product-form";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  const categories = await adminListCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">إضافة منتج جديد</h1>
      <p className="mt-1 text-sm text-muted">هتقدر ترفع الصور وتضيف محتويات الصندوق بعد إنشاء المنتج.</p>
      <div className="mt-6">
        <ProductForm categories={categories} action={createProductAction} />
      </div>
    </div>
  );
}
