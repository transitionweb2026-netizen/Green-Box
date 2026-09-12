"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <form action={formAction} className="max-w-lg space-y-4">
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
        <textarea
          id="description_ar"
          name="description_ar"
          defaultValue={category?.description_ar ?? ""}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </div>
      <div>
        <Label htmlFor="description_en">الوصف بالإنجليزي</Label>
        <textarea
          id="description_en"
          name="description_en"
          defaultValue={category?.description_en ?? ""}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </div>
      <div>
        <Label htmlFor="image_url">رابط الصورة</Label>
        <Input id="image_url" name="image_url" type="url" defaultValue={category?.image_url ?? ""} />
      </div>
      <div>
        <Label htmlFor="display_order">ترتيب العرض</Label>
        <Input id="display_order" name="display_order" type="number" defaultValue={category?.display_order ?? 0} />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="h-4 w-4" />
        نشط (ظاهر للعملاء)
      </label>

      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
