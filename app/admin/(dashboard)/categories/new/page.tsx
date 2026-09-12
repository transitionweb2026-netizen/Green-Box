import { CategoryForm } from "@/components/admin/category-form";
import { createCategoryAction } from "../actions";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">إضافة قسم جديد</h1>
      <div className="mt-6">
        <CategoryForm action={createCategoryAction} />
      </div>
    </div>
  );
}
