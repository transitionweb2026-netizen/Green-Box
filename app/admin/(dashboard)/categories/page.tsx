import Link from "next/link";
import { adminListCategories } from "@/lib/services/catalog";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeactivateButton } from "@/components/admin/deactivate-button";
import { deactivateCategoryAction } from "./actions";

export default async function AdminCategoriesPage() {
  const categories = await adminListCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">الأقسام</h1>
        <Link href="/admin/categories/new" className={buttonVariants({ size: "sm" })}>
          إضافة قسم جديد
        </Link>
      </div>

      <div className="mt-6">
        {categories.length === 0 ? (
          <Card className="text-center text-muted">لا توجد أقسام بعد.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2 text-start">الاسم</th>
                  <th className="px-4 py-2 text-start">الرابط</th>
                  <th className="px-4 py-2 text-start">الترتيب</th>
                  <th className="px-4 py-2 text-start">الحالة</th>
                  <th className="px-4 py-2 text-start">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-border last:border-b-0 hover:bg-brand-50">
                    <td className="px-4 py-2">{category.name_ar}</td>
                    <td className="px-4 py-2 text-muted">{category.slug}</td>
                    <td className="px-4 py-2">{category.display_order}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          category.is_active ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {category.is_active ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="flex gap-3 px-4 py-2">
                      <Link href={`/admin/categories/${category.id}/edit`} className="text-brand-700 hover:underline">
                        تعديل
                      </Link>
                      {category.is_active && (
                        <DeactivateButton
                          confirmMessage={`متأكد من تعطيل قسم "${category.name_ar}"؟`}
                          action={deactivateCategoryAction.bind(null, category.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
