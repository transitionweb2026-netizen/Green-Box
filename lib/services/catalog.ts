import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductImage = Tables<"product_images">;
export type ProductWithImages = Product & { product_images: ProductImage[] };

export async function listActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface ListProductsOptions {
  categoryId?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  products: ProductWithImages[];
  total: number;
  page: number;
  pageSize: number;
}

/** Paginated catalog browsing (category listing, featured products, etc). */
export async function listProducts(options: ListProductsOptions = {}): Promise<ProductPage> {
  const { categoryId, featured, page = 1, pageSize = 20 } = options;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, product_images(*)", { count: "exact" })
    .eq("is_available", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (featured) query = query.eq("is_featured", true);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("display_order", { ascending: true }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: (data as ProductWithImages[]) ?? [], total: count ?? 0, page, pageSize };
}

export async function getProductBySlug(
  slug: string,
): Promise<(ProductWithImages & { categories: Category | null }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), categories(*)")
    .eq("slug", slug)
    .eq("is_available", true)
    .maybeSingle();
  if (error) throw error;
  return data as (ProductWithImages & { categories: Category | null }) | null;
}

/**
 * Smart search -- see supabase/migrations/0011_search_function.sql. The
 * RPC returns plain product rows (no embedded images); a follow-up query
 * fetches images for just those IDs and results are re-merged in the
 * RPC's original rank order (a second `.in()` query does not preserve
 * ordering on its own).
 */
export async function searchProducts(query: string, categoryId?: string, limit = 20): Promise<ProductWithImages[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_products", {
    p_query: query,
    p_category_id: categoryId ?? null,
    p_limit: limit,
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

  return results.map((product) => ({ ...product, product_images: imagesByProduct.get(product.id) ?? [] }));
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

export async function listRelatedProducts(categoryId: string, excludeProductId: string, limit = 4): Promise<ProductWithImages[]> {
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
  return (data as ProductWithImages[]) ?? [];
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

export async function adminSetBoxContents(
  boxProductId: string,
  items: { productId: string; quantity: number }[],
): Promise<void> {
  const supabase = await createClient();
  const del = await supabase.from("box_items").delete().eq("box_product_id", boxProductId);
  if (del.error) throw del.error;
  if (items.length === 0) return;
  const { error } = await supabase.from("box_items").insert(
    items.map((item, index) => ({
      box_product_id: boxProductId,
      item_product_id: item.productId,
      quantity: item.quantity,
      display_order: index,
    })),
  );
  if (error) throw error;
}
