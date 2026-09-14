import Link from "next/link";
import { Plus, LayoutGrid } from "lucide-react";
import { adminListCategories } from "@/lib/services/catalog";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeactivateButton } from "@/components/admin/deactivate-button";
import { deactivateCategoryAction } from "./actions";

export default async function AdminCategoriesPage() {
  const categories = await adminListCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">الأقسام</h1>
        <Link href="/admin/categories/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة قسم جديد
        </Link>
      </div>

      <div className="mt-6">
        {categories.length === 0 ? (
          <EmptyState icon={<LayoutGrid className="h-7 w-7" />} title="لا توجد أقسام بعد." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-start font-semibold">الرابط</th>
                  <th className="px-4 py-3 text-start font-semibold">الترتيب</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{category.name_ar}</td>
                    <td className="px-4 py-3 text-muted">{category.slug}</td>
                    <td className="px-4 py-3 text-muted">{category.display_order}</td>
                    <td className="px-4 py-3">
                      <Badge tone={category.is_active ? "success" : "neutral"}>
                        {category.is_active ? "نشط" : "معطل"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="rounded-lg px-2 py-1 text-sm font-semibold text-deep-700 hover:bg-brand-50"
                        >
                          تعديل
                        </Link>
                        {category.is_active && (
                          <DeactivateButton
                            confirmMessage={`متأكد من تعطيل قسم "${category.name_ar}"؟`}
                            action={deactivateCategoryAction.bind(null, category.id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
