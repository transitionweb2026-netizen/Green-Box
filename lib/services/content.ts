import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Banner = Tables<"banners">;
export type Setting = Tables<"settings">;

/** Shape of the `settings` row keyed "store_info" -- kept as one shared
 * type since the storefront header/footer and the admin content page all
 * need to agree on its fields. */
export interface StoreInfo {
  store_name?: string;
  contact_phone?: string;
  contact_email?: string;
  whatsapp_phone?: string;
  /** Separate line for delivery/office enquiries, shown on the Contact
   * page -- distinct from contact_phone (general enquiries). */
  delivery_phone?: string;
  /** Social profile URLs for the Contact page's social icon row. Blank
   * until the client supplies real links -- icons render either way, but
   * only link out once a URL is set here. */
  social_facebook?: string;
  social_instagram?: string;
  social_tiktok?: string;
}

/**
 * Homepage marketing copy that's genuinely likely to change (promo
 * sections, final CTA) -- kept in the same generic `settings` table
 * (key "homepage_content") rather than a new table, matching store_info's
 * pattern. Every field is optional: the homepage falls back to its
 * existing translated default text when a field is unset, so an admin who
 * never opens this form sees no regression. The hero's title/subtitle
 * image/link are already editable via the existing banners table and are
 * deliberately not duplicated here.
 */
export interface HomepageContent {
  greenBoxTitle_ar?: string;
  greenBoxTitle_en?: string;
  greenBoxDescription_ar?: string;
  greenBoxDescription_en?: string;
  loyaltyTitle_ar?: string;
  loyaltyTitle_en?: string;
  loyaltyDescription_ar?: string;
  loyaltyDescription_en?: string;
  subscriptionTitle_ar?: string;
  subscriptionTitle_en?: string;
  subscriptionDescription_ar?: string;
  subscriptionDescription_en?: string;
  finalCtaTitle_ar?: string;
  finalCtaTitle_en?: string;
  finalCtaDescription_ar?: string;
  finalCtaDescription_en?: string;
}

export async function listActiveBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSetting<T = Json>(key: string): Promise<T | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return (data?.value as T) ?? null;
}

// --- Admin -------------------------------------------------------------

export async function adminListBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateBanner(input: TablesInsert<"banners">): Promise<Banner> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateBanner(id: string, input: TablesUpdate<"banners">): Promise<Banner> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminDeleteBanner(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

export async function adminUpsertSetting(key: string, value: Json, description?: string): Promise<Setting> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .upsert({ key, value, description }, { onConflict: "key" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function adminListSettings(): Promise<Setting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").order("key", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
