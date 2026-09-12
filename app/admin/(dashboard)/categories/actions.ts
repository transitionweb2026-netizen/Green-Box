"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminCreateCategory, adminDeleteCategory, adminUpdateCategory } from "@/lib/services/catalog";

const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens only"),
  name_ar: z.string().trim().min(1).max(150),
  name_en: z.string().trim().max(150).optional(),
  description_ar: z.string().trim().max(2000).optional(),
  description_en: z.string().trim().max(2000).optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type CategoryActionState = { status: "idle" | "error"; message?: string };

function parseForm(formData: FormData) {
  return categorySchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    name_ar: String(formData.get("name_ar") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim() || undefined,
    description_ar: String(formData.get("description_ar") ?? "").trim() || undefined,
    description_en: String(formData.get("description_en") ?? "").trim() || undefined,
    image_url: String(formData.get("image_url") ?? "").trim(),
    display_order: formData.get("display_order") ?? 0,
    is_active: formData.get("is_active") === "on",
  });
}

export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminCreateCategory({
      slug: parsed.data.slug,
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      image_url: parsed.data.image_url || null,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  categoryId: string,
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminUpdateCategory(categoryId, {
      slug: parsed.data.slug,
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      image_url: parsed.data.image_url || null,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deactivateCategoryAction(categoryId: string) {
  await adminDeleteCategory(categoryId);
  revalidatePath("/admin/categories");
}
