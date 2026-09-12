import { notFound } from "next/navigation";
import { adminGetCategory } from "@/lib/services/catalog";
import { CategoryForm } from "@/components/admin/category-form";
import { updateCategoryAction } from "../../actions";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await adminGetCategory(id);
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">تعديل القسم</h1>
      <div className="mt-6">
        <CategoryForm category={category} action={updateCategoryAction.bind(null, id)} />
      </div>
    </div>
  );
}
