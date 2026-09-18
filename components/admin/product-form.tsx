"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, Textarea } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
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
  const [soldByWeight, setSoldByWeight] = useState(product?.sold_by_weight ?? false);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <Card tone="glass">
        <h2 className="mb-4 font-bold text-foreground">البيانات الأساسية</h2>
        <div className="space-y-4">
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
              <Select id="category_id" name="category_id" defaultValue={product?.category_id} required>
                <option value="" disabled>
                  اختر القسم
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_ar}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="product_type">نوع المنتج</Label>
              <Select
                id="product_type"
                name="product_type"
                value={productType}
                onChange={(e) => setProductType(e.target.value as "standard" | "box")}
              >
                <option value="standard">منتج عادي</option>
                <option value="box">صندوق (Box)</option>
              </Select>
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
            <Label htmlFor="price">{soldByWeight ? "السعر لكل جرام (جنيه)" : "السعر (جنيه)"}</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step={soldByWeight ? "0.001" : "0.01"}
              min="0"
              defaultValue={product?.price ?? ""}
              required
            />
          </div>

          <label className="flex w-fit items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="sold_by_weight"
              checked={soldByWeight}
              onChange={(e) => setSoldByWeight(e.target.checked)}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            يُباع بالوزن (تسعير لكل جرام)
          </label>
          {soldByWeight && (
            <p className="text-xs text-muted">
              العميل هيقدر يحدد الكمية بالجرام، والإجمالي هيتحسب تلقائيًا = عدد الجرامات × السعر لكل جرام. مثال: لو السعر
              0.5 جنيه/جرام و العميل طلب 300 جرام، الإجمالي = 150 جنيه.
            </p>
          )}
        </div>
      </Card>

      <Card tone="glass">
        <h2 className="mb-4 font-bold text-foreground">الوصف</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description_ar">الوصف بالعربي</Label>
            <Textarea id="description_ar" name="description_ar" defaultValue={product?.description_ar ?? ""} rows={4} />
          </div>
          <div>
            <Label htmlFor="description_en">الوصف بالإنجليزي</Label>
            <Textarea id="description_en" name="description_en" defaultValue={product?.description_en ?? ""} rows={4} />
          </div>
        </div>
      </Card>

      <Card tone="glass">
        <h2 className="mb-4 font-bold text-foreground">SEO</h2>
        <div className="space-y-3">
          <Input name="meta_title_ar" placeholder="عنوان SEO بالعربي" defaultValue={product?.meta_title_ar ?? ""} />
          <Input name="meta_title_en" placeholder="عنوان SEO بالإنجليزي" defaultValue={product?.meta_title_en ?? ""} />
          <Input name="meta_description_ar" placeholder="وصف SEO بالعربي" defaultValue={product?.meta_description_ar ?? ""} />
          <Input name="meta_description_en" placeholder="وصف SEO بالإنجليزي" defaultValue={product?.meta_description_en ?? ""} />
        </div>
      </Card>

      <Card tone="glass">
        <h2 className="mb-4 font-bold text-foreground">الإعدادات</h2>
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="display_order">ترتيب العرض</Label>
            <Input id="display_order" name="display_order" type="number" defaultValue={product?.display_order ?? 0} />
          </div>
          <div>
            <Label htmlFor="rating">التقييم (0-5)</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="بدون تقييم"
              defaultValue={product?.rating ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="rating_count">عدد التقييمات</Label>
            <Input id="rating_count" name="rating_count" type="number" min="0" defaultValue={product?.rating_count ?? 0} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="is_available"
              defaultChecked={product?.is_available ?? true}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            متاح للبيع
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            منتج مميز
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="requires_reservation"
              defaultChecked={product?.requires_reservation ?? false}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            يتطلب حجز مسبق
          </label>
        </div>
      </Card>

      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}
      {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {!isPending && <Save className="h-4 w-4" />}
        {isPending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
