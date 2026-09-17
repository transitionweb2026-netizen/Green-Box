import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Review = Tables<"reviews">;

/**
 * Curated customer testimonials the admin writes and edits -- not tied to
 * a real order/profile, so this is plain admin-authored marketing content
 * rather than a customer-submitted review system. Cached the same way as
 * the rest of the public catalog reads (lib/services/catalog.ts).
 */
export const listActiveReviews = unstable_cache(
  async (limit = 24): Promise<Review[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  ["reviews-active"],
  { revalidate: 60, tags: ["reviews"] },
);

export async function adminListReviews(): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminGetReview(id: string): Promise<Review | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreateReview(input: TablesInsert<"reviews">): Promise<Review> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateReview(id: string, input: TablesUpdate<"reviews">): Promise<Review> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

/**
 * Real delete, not a soft deactivate -- unlike categories/products, no
 * order history or other table ever references a review row, so there's
 * nothing a hard delete could orphan (same reasoning as adminDeleteBanner
 * in lib/services/content.ts).
 */
export async function adminDeleteReview(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
