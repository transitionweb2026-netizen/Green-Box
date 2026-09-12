"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import type { ProductActionState } from "@/app/admin/(dashboard)/products/actions";
import type { Category, Product } from "@/lib/services/catalog";

export function ProductForm({
  categories,
  product,
  action,
}: {
  categories: Category[];
  product?: Product;
  action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as ProductActionState);
  const [productType, setProductType] = useState(product?.product_type ?? "standard");

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name_ar">الاسم بالعربي</Label>
          <Input id="name_ar" name="name_ar" defaultValue={product?.name_ar} required />
        </div>
        <div>
          <Label htmlFor="name_en">الاسم بالإنجليزي</Label>
          <Input id="name_en" name="name_en" defaultValue={product?.name_en ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="slug">الرابط (slug)</Label>
          <Input id="slug" name="slug" defaultValue={product?.slug} required pattern="[a-z0-9-]+" />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category_id">القسم</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id}
            required
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="" disabled>
              اختر القسم
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="product_type">نوع المنتج</Label>
          <select
            id="product_type"
            name="product_type"
            value={productType}
            onChange={(e) => setProductType(e.target.value as "standard" | "box")}
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="standard">منتج عادي</option>
            <option value="box">صندوق (Box)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="unit_label_ar">الوحدة بالعربي (مثال: كجم)</Label>
          <Input id="unit_label_ar" name="unit_label_ar" defaultValue={product?.unit_label_ar ?? ""} />
        </div>
        <div>
          <Label htmlFor="unit_label_en">الوحدة بالإنجليزي</Label>
          <Input id="unit_label_en" name="unit_label_en" defaultValue={product?.unit_label_en ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="price">السعر (جنيه)</Label>
        <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price ?? ""} required />
      </div>

      <div>
        <Label htmlFor="description_ar">الوصف بالعربي</Label>
        <textarea
          id="description_ar"
          name="description_ar"
          defaultValue={product?.description_ar ?? ""}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </div>
      <div>
        <Label htmlFor="description_en">الوصف بالإنجليزي</Label>
        <textarea
          id="description_en"
          name="description_en"
          defaultValue={product?.description_en ?? ""}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </div>

      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">SEO</legend>
        <div className="space-y-3">
          <Input name="meta_title_ar" placeholder="عنوان SEO بالعربي" defaultValue={product?.meta_title_ar ?? ""} />
          <Input name="meta_title_en" placeholder="عنوان SEO بالإنجليزي" defaultValue={product?.meta_title_en ?? ""} />
          <Input name="meta_description_ar" placeholder="وصف SEO بالعربي" defaultValue={product?.meta_description_ar ?? ""} />
          <Input name="meta_description_en" placeholder="وصف SEO بالإنجليزي" defaultValue={product?.meta_description_en ?? ""} />
        </div>
      </fieldset>

      <div>
        <Label htmlFor="display_order">ترتيب العرض</Label>
        <Input id="display_order" name="display_order" type="number" defaultValue={product?.display_order ?? 0} />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="is_available" defaultChecked={product?.is_available ?? true} className="h-4 w-4" />
          متاح للبيع
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="h-4 w-4" />
          منتج مميز
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="requires_reservation"
            defaultChecked={product?.requires_reservation ?? false}
            className="h-4 w-4"
          />
          يتطلب حجز مسبق
        </label>
      </div>

      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
