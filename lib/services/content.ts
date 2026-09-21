import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Banner = Tables<"banners">;
export type Setting = Tables<"settings">;

/** Shape of the `settings` row keyed "store_info" -- kept as one shared
 * type since the storefront header/footer and the admin content page all
 * need to agree on its fields. */
export interface StoreInfo {
  /** Bilingual so the header/footer wordmark switches with locale like
   * everything else on the site -- previously a single `store_name`
   * field, which meant an admin-entered Arabic name stuck around even on
   * the English site. Falls back to the translated default when unset. */
  store_name_ar?: string;
  store_name_en?: string;
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

/**
 * The sitewide FAQ teaser shown just above the footer on every page (see
 * components/storefront/faq-section.tsx) -- same optional-field/fallback
 * pattern as HomepageContent. Fixed at 3 Q&A pairs to match the approved
 * reference layout exactly, rather than an open-ended admin-managed list.
 */
export interface FaqContent {
  question1_ar?: string;
  question1_en?: string;
  answer1_ar?: string;
  answer1_en?: string;
  question2_ar?: string;
  question2_en?: string;
  answer2_ar?: string;
  answer2_en?: string;
  question3_ar?: string;
  question3_en?: string;
  answer3_ar?: string;
  answer3_en?: string;
  ctaLabel_ar?: string;
  ctaLabel_en?: string;
}

/**
 * Sitewide Terms & Conditions blurb shown right under the FAQ teaser, just
 * above the footer. Kept to a single body field per language -- the
 * reference this was modeled on had a specific promo-code offer that
 * doesn't apply here, so this ships with an honest placeholder ("coming
 * soon") instead, editable via CMS once real terms are ready.
 */
export interface TermsContent {
  body_ar?: string;
  body_en?: string;
}

/**
 * "Our Story" -- a single CMS-editable page, same optional-field/fallback
 * pattern as TermsContent: three short value pillars plus a lead
 * paragraph, editable from /admin/content without a new table.
 */
export interface OurStoryContent {
  heading_ar?: string;
  heading_en?: string;
  body_ar?: string;
  body_en?: string;
  pillar1Title_ar?: string;
  pillar1Title_en?: string;
  pillar1Body_ar?: string;
  pillar1Body_en?: string;
  pillar2Title_ar?: string;
  pillar2Title_en?: string;
  pillar2Body_ar?: string;
  pillar2Body_en?: string;
  pillar3Title_ar?: string;
  pillar3Title_en?: string;
  pillar3Body_ar?: string;
  pillar3Body_en?: string;
}

/** "Sustainability" -- same shape/pattern as OurStoryContent. */
export interface SustainabilityContent {
  heading_ar?: string;
  heading_en?: string;
  body_ar?: string;
  body_en?: string;
  pillar1Title_ar?: string;
  pillar1Title_en?: string;
  pillar1Body_ar?: string;
  pillar1Body_en?: string;
  pillar2Title_ar?: string;
  pillar2Title_en?: string;
  pillar2Body_ar?: string;
  pillar2Body_en?: string;
  pillar3Title_ar?: string;
  pillar3Title_en?: string;
  pillar3Body_ar?: string;
  pillar3Body_en?: string;
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

export async function adminGetBanner(id: string): Promise<Banner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
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
