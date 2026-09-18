import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductImage = Tables<"product_images">;
export type ProductWithImages = Product & {
  product_images: ProductImage[];
  categories?: { slug: string } | null;
};

/**
 * Cached with the cookie-free public client (see lib/supabase/public.ts):
 * this data is gated by is_active/is_available, never auth.uid(), so every
 * anonymous visitor gets the identical result -- a real, safe win for the
 * catalog's most-hit reads. 60s revalidate bounds how stale an admin edit
 * can appear on the storefront without needing per-mutation cache-tag
 * invalidation; nothing checkout-critical is ever read through this path
 * (create_order always re-reads live, uncached data).
 */
export const listActiveCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  ["catalog-active-categories"],
  { revalidate: 60, tags: ["categories"] },
);

export interface CategoryMenuProduct {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
}

/**
 * Lean product list (no images/description/etc) for the category nav bar's
 * hover mega-menu -- deliberately narrow columns to keep the header's
 * payload small since this loads on every storefront page. Cached the same
 * way as the rest of the catalog reads.
 */
export const listCategoryMenuProducts = unstable_cache(
  async (categoryId: string, limit = 10): Promise<CategoryMenuProduct[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name_ar, name_en")
      .eq("category_id", categoryId)
      .eq("is_available", true)
      .order("display_order", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  ["catalog-category-menu-products"],
  { revalidate: 60, tags: ["products"] },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string): Promise<Category | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  ["catalog-category-by-slug"],
  { revalidate: 60, tags: ["categories"] },
);

export interface ListProductsOptions {
  categoryId?: string;
  featured?: boolean;
  productType?: Product["product_type"];
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  products: ProductWithImages[];
  total: number;
  page: number;
  pageSize: number;
}

/** Paginated catalog browsing (category listing, featured products, etc). Cached -- see listActiveCategories. */
export const listProducts = unstable_cache(
  async (options: ListProductsOptions = {}): Promise<ProductPage> => {
    const { categoryId, featured, productType, page = 1, pageSize = 20 } = options;
    const supabase = createPublicClient();

    let query = supabase
      .from("products")
      .select("*, product_images(*), categories(slug)", { count: "exact" })
      .eq("is_available", true);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (featured) query = query.eq("is_featured", true);
    if (productType) query = query.eq("product_type", productType);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order("display_order", { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { products: (data as ProductWithImages[]) ?? [], total: count ?? 0, page, pageSize };
  },
  ["catalog-list-products"],
  { revalidate: 60, tags: ["products"] },
);

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<(ProductWithImages & { categories: Category | null }) | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_images(*), categories(*)")
      .eq("slug", slug)
      .eq("is_available", true)
      .maybeSingle();
    if (error) throw error;
    return data as (ProductWithImages & { categories: Category | null }) | null;
  },
  ["catalog-product-by-slug"],
  { revalidate: 60, tags: ["products"] },
);

/**
 * Smart search -- see supabase/migrations/0011_search_function.sql. The
 * RPC returns plain product rows (no embedded images); a follow-up query
 * fetches images for just those IDs and results are re-merged in the
 * RPC's original rank order (a second `.in()` query does not preserve
 * ordering on its own).
 */
export async function searchProducts(
  query: string,
  categoryId?: string,
  limit = 20,
  offset = 0,
): Promise<ProductWithImages[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_products", {
    p_query: query,
    p_category_id: categoryId ?? null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  const results = data ?? [];
  if (results.length === 0) return [];

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("*")
    .in(
      "product_id",
      results.map((p) => p.id),
    );
  if (imagesError) throw imagesError;

  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const image of images ?? []) {
    const list = imagesByProduct.get(image.product_id) ?? [];
    list.push(image);
    imagesByProduct.set(image.product_id, list);
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug")
    .in("id", [...new Set(results.map((p) => p.category_id))]);
  if (categoriesError) throw categoriesError;
  const slugByCategory = new Map((categories ?? []).map((c) => [c.id, c.slug]));

  return results.map((product) => ({
    ...product,
    product_images: imagesByProduct.get(product.id) ?? [],
    categories: slugByCategory.has(product.category_id) ? { slug: slugByCategory.get(product.category_id)! } : null,
  }));
}

export async function countSearchProducts(query: string, categoryId?: string): Promise<number> {
  if (!query.trim()) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("count_search_products", {
    p_query: query,
    p_category_id: categoryId ?? null,
  });
  if (error) throw error;
  return data ?? 0;
}

export interface SearchSuggestion {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  kind: "product" | "category";
}

export async function getSearchSuggestions(query: string, limit = 8): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_suggestions", { p_query: query, p_limit: limit });
  if (error) throw error;
  return (data as SearchSuggestion[]) ?? [];
}

export interface BoxContentItem {
  id: string;
  quantity: number;
  display_order: number;
  item: Product;
}

export async function getBoxContents(boxProductId: string): Promise<BoxContentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("box_items")
    .select("id, quantity, display_order, item:products!box_items_item_product_id_fkey(*)")
    .eq("box_product_id", boxProductId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data as unknown as BoxContentItem[]) ?? [];
}

/**
 * Same-category products first; if that category is too thin to fill
 * `limit` (e.g. a single-product category), tops up with other available
 * products so the storefront's "Recommended Products" section never
 * renders empty just because this particular category has nothing else.
 */
export async function listRecommendedProducts(categoryId: string, excludeProductId: string, limit = 4): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .neq("id", excludeProductId)
    .order("display_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  const sameCategory = (data as ProductWithImages[]) ?? [];

  if (sameCategory.length >= limit) return sameCategory;

  const excludeIds = [excludeProductId, ...sameCategory.map((p) => p.id)];
  const { data: fillerData, error: fillerError } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_available", true)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .limit(limit - sameCategory.length);
  if (fillerError) throw fillerError;

  return [...sameCategory, ...((fillerData as ProductWithImages[]) ?? [])];
}

// --- Admin: categories ---------------------------------------------

export async function adminListCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminGetCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreateCategory(input: TablesInsert<"categories">): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateCategory(id: string, input: TablesUpdate<"categories">): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminDeleteCategory(id: string): Promise<void> {
  // Soft delete only -- see ARCHITECTURE.md, Admin Dashboard: anything a
  // historical order can reference is deactivated, never hard-deleted.
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

// --- Admin: products -------------------------------------------------

export interface AdminListProductsOptions {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function adminListProducts(options: AdminListProductsOptions = {}) {
  const { categoryId, search, page = 1, pageSize = 25 } = options;
  const supabase = await createClient();

  let query = supabase.from("products").select("*, product_images(*), categories(name_ar, name_en)", { count: "exact" });
  if (categoryId) query = query.eq("category_id", categoryId);
  if (search) query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%,sku.ilike.%${search}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: data ?? [], total: count ?? 0, page, pageSize };
}

export async function adminGetProduct(id: string): Promise<ProductWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ProductWithImages | null;
}

export async function adminCreateProduct(input: TablesInsert<"products">): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateProduct(id: string, input: TablesUpdate<"products">): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminArchiveProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_available: false }).eq("id", id);
  if (error) throw error;
}

export async function adminAddProductImage(productId: string, url: string, isPrimary = false): Promise<ProductImage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url, is_primary: isPrimary })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeleteProductImage(imageId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
}

/**
 * Storefront image pickers (product-card.tsx, product-gallery.tsx) already
 * do `find(is_primary) ?? images[0]` -- this was previously unreachable
 * since adminAddProductImage() never set is_primary=true, so every product
 * silently fell back to "first uploaded" with no way to change it. Runs as
 * a single Postgres function call (migration 0023) so a failure between
 * the clear and the set can't leave a product with no primary image.
 */
export async function adminSetPrimaryProductImage(productId: string, imageId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_primary_product_image", {
    p_product_id: productId,
    p_image_id: imageId,
  });
  if (error) throw error;
}

/**
 * Runs as a single Postgres function call (migration 0023) so a failed
 * insert after the delete can no longer leave a box with zero contents --
 * the previous delete-then-insert was two separate client statements with
 * no transaction boundary between them.
 */
export async function adminSetBoxContents(
  boxProductId: string,
  items: { productId: string; quantity: number }[],
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_box_contents", {
    p_box_product_id: boxProductId,
    p_items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  });
  if (error) throw error;
}
