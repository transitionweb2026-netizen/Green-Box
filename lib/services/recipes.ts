import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Recipe = Tables<"recipes">;

/**
 * Admin-authored recipes for the public /recipes list + /recipes/[slug]
 * pages -- same shape/cache pattern as lib/services/reviews.ts.
 */
export const listPublishedRecipes = unstable_cache(
  async (): Promise<Recipe[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  ["recipes-published"],
  { revalidate: 60, tags: ["recipes"] },
);

export const getPublishedRecipeBySlug = unstable_cache(
  async (slug: string): Promise<Recipe | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("recipes").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
    if (error) throw error;
    return data;
  },
  ["recipe-by-slug"],
  { revalidate: 60, tags: ["recipes"] },
);

export async function adminListRecipes(): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recipes").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminGetRecipe(id: string): Promise<Recipe | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreateRecipe(input: TablesInsert<"recipes">): Promise<Recipe> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recipes").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateRecipe(id: string, input: TablesUpdate<"recipes">): Promise<Recipe> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recipes").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

/** Real delete, not a soft deactivate -- like reviews, nothing else in the
 * schema references a recipe row. */
export async function adminDeleteRecipe(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}
