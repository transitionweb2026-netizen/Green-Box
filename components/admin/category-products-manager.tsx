"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import {
  assignProductToCategoryAction,
  quickCreateProductInCategoryAction,
  type QuickCreateProductState,
} from "@/app/admin/(dashboard)/products/actions";
import type { Product } from "@/lib/services/catalog";

/**
 * Lets an admin populate a category from its own edit page instead of
 * only the other way around (picking a category inside each product's
 * form) -- two ways in, per the ask: reassign an existing product from a
 * list, or type a brand-new product's name and finish the rest (price,
 * image...) on its own edit page right after, same quick-create-then-
 * edit shape as BoxForm/createBoxAction.
 */
export function CategoryProductsManager({
  categoryId,
  categoryProducts,
  otherProducts,
}: {
  categoryId: string;
  categoryProducts: Product[];
  otherProducts: Product[];
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [assignError, setAssignError] = useState<string | null>(null);
  const [createState, createAction, isCreating] = useActionState(
    quickCreateProductInCategoryAction,
    { status: "idle" } as QuickCreateProductState,
  );

  function addExisting() {
    if (!selectedProductId) return;
    setAssignError(null);
    startTransition(async () => {
      const result = await assignProductToCategoryAction(categoryId, selectedProductId);
      if (result.status === "error") {
        setAssignError(result.message ?? "حصل خطأ");
        return;
      }
      setSelectedProductId("");
    });
  }

  return (
    <Card tone="glass">
      <h2 className="mb-4 font-bold text-foreground">منتجات هذا القسم</h2>

      <div className="space-y-2">
        {categoryProducts.length === 0 && <p className="text-sm text-muted">لا توجد منتجات في هذا القسم بعد.</p>}
        {categoryProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-white/60 p-2.5"
          >
            <span className="flex-1 text-sm font-medium text-foreground">{product.name_ar}</span>
            {!product.is_available && <Badge tone="danger">غير متاح</Badge>}
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
              aria-label="تعديل"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border/70 pt-4">
        <h3 className="mb-2 text-sm font-bold text-foreground">إضافة منتج موجود</h3>
        <div className="flex gap-2">
          <Select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="flex-1">
            <option value="">اختر منتج لنقله لهذا القسم</option>
            {otherProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name_ar}
              </option>
            ))}
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={addExisting} disabled={!selectedProductId || isPending}>
            {isPending ? "جارٍ..." : "إضافة"}
          </Button>
        </div>
        {assignError && <FormMessage className="mt-1.5">{assignError}</FormMessage>}
      </div>

      <form action={createAction} className="mt-5 border-t border-border/70 pt-4">
        <input type="hidden" name="category_id" value={categoryId} />
        <h3 className="mb-2 text-sm font-bold text-foreground">أو إنشاء منتج جديد بالاسم</h3>
        <div className="flex gap-2">
          <Input name="name_ar" placeholder="اسم المنتج بالعربي" className="flex-1" />
          <Button type="submit" size="sm" disabled={isCreating} loading={isCreating}>
            {!isCreating && <Plus className="h-4 w-4" />}
            {isCreating ? "جارٍ الإنشاء..." : "إنشاء"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted">هيتفتحلك صفحة تعديل المنتج عشان تكمل السعر والصورة والباقي.</p>
        {createState.status === "error" && <FormMessage className="mt-1.5">{createState.message}</FormMessage>}
      </form>
    </Card>
  );
}
