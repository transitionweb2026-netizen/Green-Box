"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminCreateRecipe, adminDeleteRecipe, adminGetRecipe, adminUpdateRecipe } from "@/lib/services/recipes";
import { uploadMediaFile, deleteMediaFile } from "@/lib/services/storage";

function revalidateRecipePaths() {
  revalidatePath("/admin/recipes");
  revalidateTag("recipes", "max");
  revalidatePath("/[locale]/recipes", "page");
  revalidatePath("/[locale]/recipes/[slug]", "page");
}

const recipeSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  title_ar: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200).optional(),
  description_ar: z.string().trim().max(500).optional(),
  description_en: z.string().trim().max(500).optional(),
  prep_minutes: z.coerce.number().int().min(0).optional(),
  servings: z.coerce.number().int().min(0).optional(),
  ingredients_ar: z.string().trim().max(4000).optional(),
  ingredients_en: z.string().trim().max(4000).optional(),
  steps_ar: z.string().trim().max(4000).optional(),
  steps_en: z.string().trim().max(4000).optional(),
  is_published: z.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
});

export type RecipeActionState = { status: "idle" | "error"; message?: string };

function parseForm(formData: FormData) {
  return recipeSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    title_ar: String(formData.get("title_ar") ?? "").trim(),
    title_en: String(formData.get("title_en") ?? "").trim() || undefined,
    description_ar: String(formData.get("description_ar") ?? "").trim() || undefined,
    description_en: String(formData.get("description_en") ?? "").trim() || undefined,
    prep_minutes: String(formData.get("prep_minutes") ?? "").trim() || undefined,
    servings: String(formData.get("servings") ?? "").trim() || undefined,
    ingredients_ar: String(formData.get("ingredients_ar") ?? "").trim() || undefined,
    ingredients_en: String(formData.get("ingredients_en") ?? "").trim() || undefined,
    steps_ar: String(formData.get("steps_ar") ?? "").trim() || undefined,
    steps_en: String(formData.get("steps_en") ?? "").trim() || undefined,
    is_published: formData.get("is_published") === "on",
    display_order: formData.get("display_order") ?? 0,
  });
}

export async function createRecipeAction(_prevState: RecipeActionState, formData: FormData): Promise<RecipeActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const file = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (file && file.size > 0) {
    try {
      imageUrl = await uploadMediaFile("recipes", file);
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : "فشل رفع الصورة" };
    }
  }

  try {
    await adminCreateRecipe({
      slug: parsed.data.slug,
      title_ar: parsed.data.title_ar,
      title_en: parsed.data.title_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      image_url: imageUrl,
      prep_minutes: parsed.data.prep_minutes ?? null,
      servings: parsed.data.servings ?? null,
      ingredients_ar: parsed.data.ingredients_ar ?? null,
      ingredients_en: parsed.data.ingredients_en ?? null,
      steps_ar: parsed.data.steps_ar ?? null,
      steps_en: parsed.data.steps_en ?? null,
      is_published: parsed.data.is_published,
      display_order: parsed.data.display_order,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidateRecipePaths();
  redirect("/admin/recipes");
}

export async function updateRecipeAction(
  recipeId: string,
  _prevState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const existing = await adminGetRecipe(recipeId);
  if (!existing) return { status: "error", message: "الوصفة غير موجودة" };

  const file = formData.get("image") as File | null;
  let imageUrl = existing.image_url;
  if (file && file.size > 0) {
    try {
      imageUrl = await uploadMediaFile("recipes", file);
      if (existing.image_url) await deleteMediaFile(existing.image_url).catch(() => {});
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : "فشل رفع الصورة" };
    }
  }

  try {
    await adminUpdateRecipe(recipeId, {
      slug: parsed.data.slug,
      title_ar: parsed.data.title_ar,
      title_en: parsed.data.title_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      image_url: imageUrl,
      prep_minutes: parsed.data.prep_minutes ?? null,
      servings: parsed.data.servings ?? null,
      ingredients_ar: parsed.data.ingredients_ar ?? null,
      ingredients_en: parsed.data.ingredients_en ?? null,
      steps_ar: parsed.data.steps_ar ?? null,
      steps_en: parsed.data.steps_en ?? null,
      is_published: parsed.data.is_published,
      display_order: parsed.data.display_order,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidateRecipePaths();
  redirect("/admin/recipes");
}

export async function deleteRecipeAction(recipeId: string) {
  const existing = await adminGetRecipe(recipeId);
  await adminDeleteRecipe(recipeId);
  if (existing?.image_url) await deleteMediaFile(existing.image_url).catch(() => {});
  revalidateRecipePaths();
}
