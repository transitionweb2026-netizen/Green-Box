"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminCreateCategory, adminDeleteCategory, adminUpdateCategory } from "@/lib/services/catalog";

/**
 * Same gap as products/actions.ts: revalidateTag("categories") busts the
 * data cache, but the storefront's own Full Route Cache for pages built on
 * that data needs busting too -- including the root layout, since the
 * category nav bar and footer categories column (site-header.tsx,
 * site-footer.tsx) render on every single page.
 */
function revalidateStorefrontCategoryPaths() {
  revalidatePath("/[locale]", "layout");
  revalidatePath("/[locale]/c", "page");
  revalidatePath("/[locale]/c/[categorySlug]", "page");
}

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
  meta_title_ar: z.string().trim().max(200).optional(),
  meta_title_en: z.string().trim().max(200).optional(),
  meta_description_ar: z.string().trim().max(500).optional(),
  meta_description_en: z.string().trim().max(500).optional(),
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
    meta_title_ar: String(formData.get("meta_title_ar") ?? "").trim() || undefined,
    meta_title_en: String(formData.get("meta_title_en") ?? "").trim() || undefined,
    meta_description_ar: String(formData.get("meta_description_ar") ?? "").trim() || undefined,
    meta_description_en: String(formData.get("meta_description_en") ?? "").trim() || undefined,
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
      meta_title_ar: parsed.data.meta_title_ar ?? null,
      meta_title_en: parsed.data.meta_title_en ?? null,
      meta_description_ar: parsed.data.meta_description_ar ?? null,
      meta_description_en: parsed.data.meta_description_en ?? null,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/categories");
  revalidateTag("categories", "max");
  revalidateStorefrontCategoryPaths();
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
      meta_title_ar: parsed.data.meta_title_ar ?? null,
      meta_title_en: parsed.data.meta_title_en ?? null,
      meta_description_ar: parsed.data.meta_description_ar ?? null,
      meta_description_en: parsed.data.meta_description_en ?? null,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/categories");
  revalidateTag("categories", "max");
  revalidateStorefrontCategoryPaths();
  redirect("/admin/categories");
}

export async function deactivateCategoryAction(categoryId: string) {
  await adminDeleteCategory(categoryId);
  revalidatePath("/admin/categories");
  revalidateTag("categories", "max");
  revalidateStorefrontCategoryPaths();
}
