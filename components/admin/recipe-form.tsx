"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import type { RecipeActionState } from "@/app/admin/(dashboard)/recipes/actions";
import type { Recipe } from "@/lib/services/recipes";

export function RecipeForm({
  recipe,
  action,
}: {
  recipe?: Recipe;
  action: (state: RecipeActionState, formData: FormData) => Promise<RecipeActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as RecipeActionState);

  return (
    <Card tone="glass" className="max-w-2xl">
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title_ar">العنوان بالعربي</Label>
            <Input id="title_ar" name="title_ar" defaultValue={recipe?.title_ar} required />
          </div>
          <div>
            <Label htmlFor="title_en">العنوان بالإنجليزي</Label>
            <Input id="title_en" name="title_en" defaultValue={recipe?.title_en ?? ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="slug">الرابط المختصر (slug)</Label>
          <Input id="slug" name="slug" defaultValue={recipe?.slug} placeholder="e.g. tomato-salad" dir="ltr" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="description_ar">وصف قصير بالعربي</Label>
            <Textarea id="description_ar" name="description_ar" rows={2} defaultValue={recipe?.description_ar ?? ""} />
          </div>
          <div>
            <Label htmlFor="description_en">وصف قصير بالإنجليزي</Label>
            <Textarea id="description_en" name="description_en" rows={2} defaultValue={recipe?.description_en ?? ""} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="prep_minutes">وقت التحضير (بالدقائق)</Label>
            <Input id="prep_minutes" name="prep_minutes" type="number" min="0" defaultValue={recipe?.prep_minutes ?? ""} />
          </div>
          <div>
            <Label htmlFor="servings">عدد الأفراد</Label>
            <Input id="servings" name="servings" type="number" min="0" defaultValue={recipe?.servings ?? ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="image">صورة الوصفة</Label>
          {recipe?.image_url && (
            <div className="relative mb-2 h-32 w-full max-w-xs overflow-hidden rounded-xl bg-brand-50">
              <Image src={recipe.image_url} alt={recipe.title_ar} fill sizes="320px" className="object-cover" />
            </div>
          )}
          <input id="image" type="file" name="image" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ingredients_ar">المكونات بالعربي (سطر لكل عنصر)</Label>
            <Textarea id="ingredients_ar" name="ingredients_ar" rows={5} defaultValue={recipe?.ingredients_ar ?? ""} />
          </div>
          <div>
            <Label htmlFor="ingredients_en">المكونات بالإنجليزي (سطر لكل عنصر)</Label>
            <Textarea id="ingredients_en" name="ingredients_en" rows={5} defaultValue={recipe?.ingredients_en ?? ""} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="steps_ar">خطوات التحضير بالعربي (سطر لكل خطوة)</Label>
            <Textarea id="steps_ar" name="steps_ar" rows={6} defaultValue={recipe?.steps_ar ?? ""} />
          </div>
          <div>
            <Label htmlFor="steps_en">خطوات التحضير بالإنجليزي (سطر لكل خطوة)</Label>
            <Textarea id="steps_en" name="steps_en" rows={6} defaultValue={recipe?.steps_en ?? ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="display_order">ترتيب العرض</Label>
          <Input id="display_order" name="display_order" type="number" defaultValue={recipe?.display_order ?? 0} className="max-w-xs" />
        </div>

        <label className="flex w-fit items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={recipe?.is_published ?? true}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          منشورة (ظاهرة للعملاء)
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
