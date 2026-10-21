"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ImageIcon, Save, Upload } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { uploadCategoryImageAction } from "@/app/admin/(dashboard)/categories/actions";
import type { CategoryActionState } from "@/app/admin/(dashboard)/categories/actions";
import type { Category } from "@/lib/services/catalog";

/**
 * The category's one card image -- a direct upload, auto-submitting the
 * moment a file is chosen, same pattern as BoxForm's BoxImageUpload /
 * HeroImagesManager. Only shown once the category exists (upload needs a
 * real category id), same as every other image flow in this admin.
 */
function CategoryImageUpload({ categoryId, imageUrl }: { categoryId: string; imageUrl: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await uploadCategoryImageAction(categoryId, formData);
          if (result.status === "error") setError(result.message ?? "فشل رفع الصورة");
        });
      }}
      className="flex items-center gap-4"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-50">
        {imageUrl ? (
          <Image src={imageUrl} alt="صورة القسم" fill sizes="96px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-2">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Upload className="h-4 w-4" />
          {isPending ? "جارٍ الرفع..." : imageUrl ? "تغيير الصورة" : "رفع صورة القسم"}
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isPending}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
        <p className="mt-1.5 text-xs text-muted">هي الصورة اللي هتظهر في بطاقة القسم بالصفحة الرئيسية.</p>
        <FormMessage className="mt-1">{error}</FormMessage>
      </div>
    </form>
  );
}

export function CategoryForm({
  category,
  action,
}: {
  category?: Category;
  action: (state: CategoryActionState, formData: FormData) => Promise<CategoryActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as CategoryActionState);

  return (
    <div className="max-w-lg space-y-5">
      {category && (
        <Card tone="glass">
          <h2 className="mb-4 font-bold text-foreground">صورة البطاقة</h2>
          <CategoryImageUpload categoryId={category.id} imageUrl={category.image_url} />
        </Card>
      )}

      <Card tone="glass">
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
    </div>
  );
}
