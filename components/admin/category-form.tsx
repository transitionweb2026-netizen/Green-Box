"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import type { CategoryActionState } from "@/app/admin/(dashboard)/categories/actions";
import type { Category } from "@/lib/services/catalog";

export function CategoryForm({
  category,
  action,
}: {
  category?: Category;
  action: (state: CategoryActionState, formData: FormData) => Promise<CategoryActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as CategoryActionState);

  return (
    <Card tone="glass" className="max-w-lg">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name_ar">الاسم بالعربي</Label>
          <Input id="name_ar" name="name_ar" defaultValue={category?.name_ar} required />
        </div>
        <div>
          <Label htmlFor="name_en">الاسم بالإنجليزي</Label>
          <Input id="name_en" name="name_en" defaultValue={category?.name_en ?? ""} />
        </div>
        <div>
          <Label htmlFor="slug">الرابط (slug)</Label>
          <Input id="slug" name="slug" defaultValue={category?.slug} required pattern="[a-z0-9-]+" />
        </div>
        <div>
          <Label htmlFor="description_ar">الوصف بالعربي</Label>
          <Textarea id="description_ar" name="description_ar" defaultValue={category?.description_ar ?? ""} rows={3} />
        </div>
        <div>
          <Label htmlFor="description_en">الوصف بالإنجليزي</Label>
          <Textarea id="description_en" name="description_en" defaultValue={category?.description_en ?? ""} rows={3} />
        </div>
        <div>
          <Label htmlFor="image_url">رابط الصورة</Label>
          <Input id="image_url" name="image_url" type="url" defaultValue={category?.image_url ?? ""} />
        </div>
        <div>
          <Label htmlFor="display_order">ترتيب العرض</Label>
          <Input id="display_order" name="display_order" type="number" defaultValue={category?.display_order ?? 0} />
        </div>

        <div className="border-t border-border/70 pt-4">
          <h3 className="mb-3 text-sm font-bold text-foreground">إعدادات SEO (اختياري)</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="meta_title_ar">عنوان SEO بالعربي</Label>
              <Input id="meta_title_ar" name="meta_title_ar" defaultValue={category?.meta_title_ar ?? ""} />
            </div>
            <div>
              <Label htmlFor="meta_title_en">عنوان SEO بالإنجليزي</Label>
              <Input id="meta_title_en" name="meta_title_en" defaultValue={category?.meta_title_en ?? ""} />
            </div>
            <div>
              <Label htmlFor="meta_description_ar">وصف SEO بالعربي</Label>
              <Textarea
                id="meta_description_ar"
                name="meta_description_ar"
                defaultValue={category?.meta_description_ar ?? ""}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="meta_description_en">وصف SEO بالإنجليزي</Label>
              <Textarea
                id="meta_description_en"
                name="meta_description_en"
                defaultValue={category?.meta_description_en ?? ""}
                rows={2}
              />
            </div>
          </div>
        </div>

        <label className="flex w-fit items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={category?.is_active ?? true}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          نشط (ظاهر للعملاء)
        </label>

        {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

        <Button type="submit" disabled={isPending} loading={isPending}>
          {!isPending && <Save className="h-4 w-4" />}
          {isPending ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </form>
    </Card>
  );
}
