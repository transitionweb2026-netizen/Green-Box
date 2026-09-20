import Link from "next/link";
import { ChefHat, Plus } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { adminListRecipes } from "@/lib/services/recipes";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteRecipeAction } from "./actions";

export default async function AdminRecipesPage() {
  const recipes = await adminListRecipes();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">الوصفات</h1>
        <Link href="/admin/recipes/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة وصفة جديدة
        </Link>
      </div>

      <div className="mt-6">
        {recipes.length === 0 ? (
          <EmptyState icon={<ChefHat className="h-7 w-7" />} title="لا توجد وصفات بعد." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">الصورة</th>
                  <th className="px-4 py-3 text-start font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-start font-semibold">الترتيب</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe) => (
                  <tr key={recipe.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-brand-50">
                        {recipe.image_url && (
                          <Image src={recipe.image_url} alt={recipe.title_ar} fill sizes="48px" className="object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{recipe.title_ar}</td>
                    <td className="px-4 py-3 text-muted">{recipe.display_order}</td>
                    <td className="px-4 py-3">
                      <Badge tone={recipe.is_published ? "success" : "neutral"}>{recipe.is_published ? "منشورة" : "مسودة"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/recipes/${recipe.id}/edit`}
                          className="rounded-lg px-2 py-1 text-sm font-semibold text-deep-700 hover:bg-brand-50"
                        >
                          تعديل
                        </Link>
                        <DeleteButton
                          confirmMessage={`متأكد من حذف وصفة "${recipe.title_ar}"؟`}
                          action={deleteRecipeAction.bind(null, recipe.id)}
                        />
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
