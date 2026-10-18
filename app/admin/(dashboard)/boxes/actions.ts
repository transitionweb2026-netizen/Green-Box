"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  adminAddProductImage,
  adminArchiveProduct,
  adminCreateProduct,
  adminDeleteProductImage,
  adminGetProduct,
  adminListCategories,
  adminUpdateProduct,
} from "@/lib/services/catalog";
import { uploadMediaFile, deleteMediaFile } from "@/lib/services/storage";

export type BoxActionState = { status: "idle" | "error" | "success"; message?: string };

/** Same two Full Route Cache paths products/actions.ts's
 * revalidateStorefrontProductPaths busts -- a box is a product under the
 * hood, so it needs the same storefront invalidation, plus /admin/boxes
 * (not /admin/products) for this dedicated flow's own list. */
function revalidateBoxPaths() {
  revalidatePath("/admin/boxes");
  revalidatePath("/[locale]/p/[productSlug]", "page");
  revalidatePath("/[locale]/box", "page");
  revalidatePath("/[locale]", "page");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Boxes always live in the fixed "Green Box Boxes" category -- asking
 * an admin to pick a grocery category for a curated box never made
 * sense, so this resolves it server-side instead of showing a picker. */
async function getBoxCategoryId(): Promise<string> {
  const categories = await adminListCategories();
  const match = categories.find((c) => c.slug === "green-box-boxes");
  if (!match) throw new Error('القسم الثابت "صناديق جرين بوكس" مش موجود -- تواصل مع الدعم الفني.');
  return match.id;
}

const boxSchema = z.object({
  name_ar: z.string().trim().min(1, "الاسم بالعربي مطلوب").max(200),
  name_en: z.string().trim().max(200).optional(),
  description_ar: z.string().trim().max(4000).optional(),
  description_en: z.string().trim().max(4000).optional(),
  price: z.coerce.number().min(0, "السعر لازم يكون رقم موجب"),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

function parseForm(formData: FormData) {
  return boxSchema.safeParse({
    name_ar: String(formData.get("name_ar") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim() || undefined,
    description_ar: String(formData.get("description_ar") ?? "").trim() || undefined,
    description_en: String(formData.get("description_en") ?? "").trim() || undefined,
    price: formData.get("price") ?? 0,
    is_available: formData.get("is_available") === "on",
    is_featured: formData.get("is_featured") === "on",
  });
}

export async function createBoxAction(_prevState: BoxActionState, formData: FormData): Promise<BoxActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  let boxId: string;
  try {
    const categoryId = await getBoxCategoryId();
    const base = slugify(parsed.data.name_en || parsed.data.name_ar) || "green-box";
    const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

    const box = await adminCreateProduct({
      category_id: categoryId,
      product_type: "box",
      slug,
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      price: parsed.data.price,
      sold_by_weight: false,
      is_available: parsed.data.is_available,
      requires_reservation: false,
      is_featured: parsed.data.is_featured,
      display_order: 0,
      rating_count: 0,
    });
    boxId = box.id;
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ أثناء إنشاء الصندوق" };
  }

  revalidateBoxPaths();
  revalidateTag("products", "max");
  redirect(`/admin/boxes/${boxId}/edit`);
}

export async function updateBoxAction(
  boxId: string,
  _prevState: BoxActionState,
  formData: FormData,
): Promise<BoxActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminUpdateProduct(boxId, {
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      price: parsed.data.price,
      is_available: parsed.data.is_available,
      is_featured: parsed.data.is_featured,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath(`/admin/boxes/${boxId}/edit`);
  revalidateBoxPaths();
  revalidateTag("products", "max");
  return { status: "success" };
}

export async function archiveBoxAction(boxId: string) {
  await adminArchiveProduct(boxId);
  revalidateBoxPaths();
  revalidateTag("products", "max");
}

export type UploadBoxImageState = { status: "idle" | "error"; message?: string };

/** Enforces "one card image" by design (see components/admin/box-
 * form.tsx's doc comment): replaces whatever image(s) already exist
 * rather than adding another one, unlike the grocery ProductImageManager
 * which supports a full gallery with a separate primary-image picker. */
export async function uploadBoxImageAction(boxId: string, formData: FormData): Promise<UploadBoxImageState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { status: "idle" };

  let url: string;
  try {
    url = await uploadMediaFile("products", file);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "فشل رفع الصورة" };
  }

  const existing = await adminGetProduct(boxId);
  const existingImages = existing?.product_images ?? [];

  await adminAddProductImage(boxId, url, true);
  for (const image of existingImages) {
    await adminDeleteProductImage(image.id);
    await deleteMediaFile(image.url).catch(() => {});
  }

  revalidatePath(`/admin/boxes/${boxId}/edit`);
  revalidateBoxPaths();
  revalidateTag("products", "max");
  return { status: "idle" };
}
