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
  type Product,
} from "@/lib/services/catalog";
import { uploadMediaFile, deleteMediaFile } from "@/lib/services/storage";
import { weightUnitMultiplier } from "@/lib/utils/weight-unit";
import type { BoxItemQuantityUnit, WeightUnit } from "@/types/database";

/**
 * revalidateTag("products") busts the unstable_cache DATA underneath
 * listProducts()/getProductBySlug(), but every storefront page built on
 * top of that data (product detail, category listings, homepage, search,
 * boxes) still needs its own Full Route Cache entry busted explicitly --
 * without this, a product edit (including an image upload) only shows up
 * on the storefront after that page's own ~60s revalidate window happens
 * to elapse, which reads as "uploaded images don't appear on the site".
 */
function revalidateStorefrontProductPaths() {
  revalidatePath("/[locale]/p/[productSlug]", "page");
  revalidatePath("/[locale]/c/[categorySlug]", "page");
  revalidatePath("/[locale]/c", "page");
  revalidatePath("/[locale]/search", "page");
  revalidatePath("/[locale]/box", "page");
  revalidatePath("/[locale]", "page");
}

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
  sold_by_weight: z.boolean().default(false),
  weight_unit: z.enum(["gram", "kg"]).default("gram"),
  prep_note_ar: z.string().trim().max(200).optional(),
  prep_note_en: z.string().trim().max(200).optional(),
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

/** The admin types a price "per weight_unit" (e.g. 25 EGP/kg), but
 * products.price is always stored as EGP-per-gram (see
 * lib/utils/weight-unit.ts) -- this is the one place that conversion
 * happens on the way in, mirrored by displayUnitPrice() on the way out. */
function priceToStore(input: number, soldByWeight: boolean, weightUnit: WeightUnit): number {
  if (!soldByWeight) return input;
  return input / weightUnitMultiplier(weightUnit);
}

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
    sold_by_weight: formData.get("sold_by_weight") === "on",
    weight_unit: String(formData.get("weight_unit") ?? "gram"),
    prep_note_ar: String(formData.get("prep_note_ar") ?? "").trim() || undefined,
    prep_note_en: String(formData.get("prep_note_en") ?? "").trim() || undefined,
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
      price: priceToStore(parsed.data.price, parsed.data.sold_by_weight, parsed.data.weight_unit),
      sold_by_weight: parsed.data.sold_by_weight,
      weight_unit: parsed.data.weight_unit,
      prep_note_ar: parsed.data.prep_note_ar ?? null,
      prep_note_en: parsed.data.prep_note_en ?? null,
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
  revalidateStorefrontProductPaths();
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
      price: priceToStore(parsed.data.price, parsed.data.sold_by_weight, parsed.data.weight_unit),
      sold_by_weight: parsed.data.sold_by_weight,
      weight_unit: parsed.data.weight_unit,
      prep_note_ar: parsed.data.prep_note_ar ?? null,
      prep_note_en: parsed.data.prep_note_en ?? null,
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
  revalidateStorefrontProductPaths();
  return { status: "success" };
}

export async function archiveProductAction(productId: string) {
  await adminArchiveProduct(productId);
  revalidatePath("/admin/products");
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
}

export type UploadImageState = { status: "idle" | "error"; message?: string };

/**
 * Previously threw straight out of the action on any upload failure (wrong
 * file type, over the 5MB limit, a storage/network hiccup) -- since the
 * caller never caught it, that crashed all the way up to the admin's
 * generic error boundary instead of showing the actual reason. Now returns
 * a real state the form can display.
 */
export async function uploadProductImageAction(productId: string, formData: FormData): Promise<UploadImageState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { status: "idle" };

  try {
    const url = await uploadMediaFile("products", file);
    await adminAddProductImage(productId, url);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "فشل رفع الصورة" };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
  return { status: "idle" };
}

export async function deleteProductImageAction(productId: string, imageId: string, url: string) {
  await adminDeleteProductImage(imageId);
  await deleteMediaFile(url).catch(() => {});
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
}

export async function setPrimaryProductImageAction(productId: string, imageId: string) {
  await adminSetPrimaryProductImage(productId, imageId);
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/products");
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
}

export type SetBoxContentsState = { status: "idle" | "error"; message?: string };

/**
 * Previously threw straight out of the action on any failure (e.g. the
 * underlying admin_set_box_contents RPC rejecting a value it doesn't
 * accept) -- same crash-to-generic-error-boundary bug as the image
 * upload actions had before they were fixed, since BoxContentsEditor's
 * save() never caught anything either. Now returns a real state so the
 * editor can show the actual reason instead of crashing the page.
 */
export async function setBoxContentsAction(
  productId: string,
  items: {
    productId: string;
    quantity: number;
    quantityUnit: BoxItemQuantityUnit;
    prepNoteAr?: string | null;
    prepNoteEn?: string | null;
  }[],
): Promise<SetBoxContentsState> {
  try {
    await adminSetBoxContents(productId, items);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "فشل حفظ محتويات الصندوق" };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/admin/boxes/${productId}/edit`);
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
  return { status: "idle" };
}

export type AssignCategoryState = { status: "idle" | "error"; message?: string };

/** "Add an existing product to this category" from the category's own
 * edit page -- products.category_id is a single FK (not a join table),
 * so "adding" an already-created product here means reassigning it,
 * exactly like changing its category in the full product form would. */
export async function assignProductToCategoryAction(categoryId: string, productId: string): Promise<AssignCategoryState> {
  try {
    await adminUpdateProduct(productId, { category_id: categoryId });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/categories/${categoryId}/edit`);
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
  return { status: "idle" };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const quickCreateProductSchema = z.object({
  category_id: z.string().uuid(),
  name_ar: z.string().trim().min(1, "اكتب اسم المنتج"),
});

export type QuickCreateProductState = { status: "idle" | "error"; message?: string };

/**
 * The "or just type a name" half of adding a product to a category --
 * creates a minimal product (name only, price 0, unavailable until the
 * admin fills in the rest) and sends them straight to its edit page to
 * finish it, same shape as createBoxAction's quick-create-then-edit flow.
 * is_available is forced false here (unlike the full product form, which
 * defaults to available) so a $0 placeholder product can never go live
 * just because the admin hasn't set a real price yet.
 */
export async function quickCreateProductInCategoryAction(
  _prevState: QuickCreateProductState,
  formData: FormData,
): Promise<QuickCreateProductState> {
  const parsed = quickCreateProductSchema.safeParse({
    category_id: String(formData.get("category_id") ?? ""),
    name_ar: String(formData.get("name_ar") ?? "").trim(),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  let productId: string;
  try {
    const base = slugify(parsed.data.name_ar) || "product";
    const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    const product = await adminCreateProduct({
      category_id: parsed.data.category_id,
      product_type: "standard",
      slug,
      name_ar: parsed.data.name_ar,
      price: 0,
      is_available: false,
    });
    productId = product.id;
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ أثناء إنشاء المنتج" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/categories/${parsed.data.category_id}/edit`);
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
  redirect(`/admin/products/${productId}/edit`);
}

export type QuickCreateBoxItemState = { status: "idle" | "error"; message?: string; product?: Product };

/**
 * Lets an admin type a box-item name that isn't a product yet (e.g. a
 * Mahshi ingredient like "كوسة" with no standalone listing) straight from
 * BoxContentsEditor, instead of having to go create it as a full product
 * first. Mirrors quickCreateProductInCategoryAction's minimal-product
 * shape (name only, price 0, is_available: false so it can never be sold
 * on its own) but returns the created product instead of redirecting,
 * since the editor adds it to the box's item list in place and the admin
 * still needs to hit "save contents" themselves. Reuses the box's own
 * category_id as the new product's category (there's no category picker
 * in this flow) -- an admin can still move it elsewhere later from the
 * product's own edit page.
 */
export async function quickCreateBoxItemProductAction(
  categoryId: string,
  nameAr: string,
): Promise<QuickCreateBoxItemState> {
  const name = nameAr.trim();
  if (!name) return { status: "error", message: "اكتب اسم المنتج" };

  let product: Product;
  try {
    const base = slugify(name) || "product";
    const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    product = await adminCreateProduct({
      category_id: categoryId,
      product_type: "standard",
      slug,
      name_ar: name,
      price: 0,
      is_available: false,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ أثناء إنشاء المنتج" };
  }

  revalidatePath("/admin/products");
  revalidateTag("products", "max");
  revalidateStorefrontProductPaths();
  return { status: "idle", product };
}
