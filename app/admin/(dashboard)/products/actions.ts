"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  adminAddProductImage,
  adminCreateProduct,
  adminDeleteProductImage,
  adminSetPrimaryProductImage,
  adminArchiveProduct,
  adminSetBoxContents,
  adminUpdateProduct,
} from "@/lib/services/catalog";
import { uploadMediaFile, deleteMediaFile } from "@/lib/services/storage";

const productSchema = z.object({
  category_id: z.string().uuid(),
  product_type: z.enum(["standard", "box"]).default("standard"),
  sku: z.string().trim().max(50).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  name_ar: z.string().trim().min(1).max(200),
  name_en: z.string().trim().max(200).optional(),
  description_ar: z.string().trim().max(4000).optional(),
  description_en: z.string().trim().max(4000).optional(),
  unit_label_ar: z.string().trim().max(50).optional(),
  unit_label_en: z.string().trim().max(50).optional(),
  price: z.coerce.number().min(0),
  is_available: z.boolean().default(true),
  requires_reservation: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  display_order: z.coerce.number().int().default(0),
  rating: z.coerce.number().min(0).max(5).optional(),
  rating_count: z.coerce.number().int().min(0).default(0),
  meta_title_ar: z.string().trim().max(200).optional(),
  meta_title_en: z.string().trim().max(200).optional(),
  meta_description_ar: z.string().trim().max(500).optional(),
  meta_description_en: z.string().trim().max(500).optional(),
});

export type ProductActionState = { status: "idle" | "error" | "success"; message?: string; productId?: string };

function parseForm(formData: FormData) {
  return productSchema.safeParse({
    category_id: String(formData.get("category_id") ?? ""),
    product_type: String(formData.get("product_type") ?? "standard"),
    sku: String(formData.get("sku") ?? "").trim() || undefined,
    slug: String(formData.get("slug") ?? "").trim(),
    name_ar: String(formData.get("name_ar") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim() || undefined,
    description_ar: String(formData.get("description_ar") ?? "").trim() || undefined,
    description_en: String(formData.get("description_en") ?? "").trim() || undefined,
    unit_label_ar: String(formData.get("unit_label_ar") ?? "").trim() || undefined,
    unit_label_en: String(formData.get("unit_label_en") ?? "").trim() || undefined,
    price: formData.get("price") ?? 0,
    is_available: formData.get("is_available") === "on",
    requires_reservation: formData.get("requires_reservation") === "on",
    is_featured: formData.get("is_featured") === "on",
    display_order: formData.get("display_order") ?? 0,
    rating: String(formData.get("rating") ?? "").trim() || undefined,
    rating_count: formData.get("rating_count") ?? 0,
    meta_title_ar: String(formData.get("meta_title_ar") ?? "").trim() || undefined,
    meta_title_en: String(formData.get("meta_title_en") ?? "").trim() || undefined,
    meta_description_ar: String(formData.get("meta_description_ar") ?? "").trim() || undefined,
    meta_description_en: String(formData.get("meta_description_en") ?? "").trim() || undefined,
  });
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  let productId: string;
  try {
    const product = await adminCreateProduct({
      category_id: parsed.data.category_id,
      product_type: parsed.data.product_type,
      sku: parsed.data.sku ?? null,
      slug: parsed.data.slug,
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      unit_label_ar: parsed.data.unit_label_ar ?? null,
      unit_label_en: parsed.data.unit_label_en ?? null,
      price: parsed.data.price,
      is_available: parsed.data.is_available,
      requires_reservation: parsed.data.requires_reservation,
      is_featured: parsed.data.is_featured,
      display_order: parsed.data.display_order,
      rating: parsed.data.rating ?? null,
      rating_count: parsed.data.rating_count,
      meta_title_ar: parsed.data.meta_title_ar ?? null,
      meta_title_en: parsed.data.meta_title_en ?? null,
      meta_description_ar: parsed.data.meta_description_ar ?? null,
      meta_description_en: parsed.data.meta_description_en ?? null,
    });
    productId = product.id;
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/products");
  revalidateTag("products", "max");
  redirect(`/admin/products/${productId}/edit`);
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminUpdateProduct(productId, {
      category_id: parsed.data.category_id,
      product_type: parsed.data.product_type,
      sku: parsed.data.sku ?? null,
      slug: parsed.data.slug,
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      description_ar: parsed.data.description_ar ?? null,
      description_en: parsed.data.description_en ?? null,
      unit_label_ar: parsed.data.unit_label_ar ?? null,
      unit_label_en: parsed.data.unit_label_en ?? null,
      price: parsed.data.price,
      is_available: parsed.data.is_available,
      requires_reservation: parsed.data.requires_reservation,
      is_featured: parsed.data.is_featured,
      display_order: parsed.data.display_order,
      rating: parsed.data.rating ?? null,
      rating_count: parsed.data.rating_count,
      meta_title_ar: parsed.data.meta_title_ar ?? null,
      meta_title_en: parsed.data.meta_title_en ?? null,
      meta_description_ar: parsed.data.meta_description_ar ?? null,
      meta_description_en: parsed.data.meta_description_en ?? null,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateTag("products", "max");
  return { status: "success" };
}

export async function archiveProductAction(productId: string) {
  await adminArchiveProduct(productId);
  revalidatePath("/admin/products");
  revalidateTag("products", "max");
}

export async function uploadProductImageAction(productId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const url = await uploadMediaFile("products", file);
  await adminAddProductImage(productId, url);
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateTag("products", "max");
}

export async function deleteProductImageAction(productId: string, imageId: string, url: string) {
  await adminDeleteProductImage(imageId);
  await deleteMediaFile(url).catch(() => {});
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateTag("products", "max");
}

export async function setPrimaryProductImageAction(productId: string, imageId: string) {
  await adminSetPrimaryProductImage(productId, imageId);
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/products");
  revalidateTag("products", "max");
}

export async function setBoxContentsAction(productId: string, items: { productId: string; quantity: number }[]) {
  await adminSetBoxContents(productId, items);
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateTag("products", "max");
}
