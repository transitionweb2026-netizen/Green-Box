import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { setDeepValue, deleteDeepValue } from "@/lib/i18n/deep-object";
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
 * The two hero images that had no upload path at all before this: the
 * permanent branded box+produce composition (shown whenever no admin
 * banner is configured -- see components/storefront/hero-carousel.tsx's
 * BOX_COMPOSITION_IMAGE) and the hero section's botanical backdrop (see
 * app/[locale]/page.tsx's inline background-image). Both fall back to
 * their shipped static asset when unset, so nothing breaks before an
 * admin uploads a replacement. The rotating banner images themselves
 * (shown once any banner exists) are already admin-uploadable via the
 * existing banners table/BannerManager and aren't duplicated here.
 */
export interface HeroImages {
  boxCompositionUrl?: string;
  backgroundUrl?: string;
  /** The /box ("Green Box" landing page) hero photo -- that page had no
   * upload path at all before this, it only ever rendered an external
   * placeholder image (see app/[locale]/box/page.tsx git history). Falls
   * back to the homepage's box composition asset when unset. */
  greenBoxPageUrl?: string;
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

/**
 * The sitewide translation-override system (see /admin/translations):
 * admin-entered replacement text for any next-intl message key, stored
 * as a sparse nested JSON blob matching the real shape of
 * messages/{locale}.json (only overridden keys present), reusing the
 * same generic `settings` table as every other CMS blob here -- one row
 * per locale, keyed "i18n_overrides_ar" / "i18n_overrides_en".
 *
 * Deliberately cached with the cookie-free public client + unstable_cache
 * (same pattern as listActiveCategories above), unlike plain getSetting:
 * i18n/request.ts calls this on every single page render across the
 * whole app to build next-intl's message object, so this is the
 * highest-traffic read in the entire CMS system and an uncached
 * cookie-bound query here would add real latency sitewide. Not
 * personalized (identical for every visitor of a given locale), so the
 * public client is safe here for the same reason it's safe for the
 * catalog reads.
 */
export const getTranslationOverrides = unstable_cache(
  async (locale: string): Promise<Record<string, Json>> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", `i18n_overrides_${locale}`)
      .maybeSingle();
    if (error) throw error;
    return (data?.value as Record<string, Json>) ?? {};
  },
  ["i18n-overrides"],
  { revalidate: 60, tags: ["i18n-overrides"] },
);

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

/** Uncached, fresh read for the /admin/translations editor -- the
 * public getTranslationOverrides above is 60s-cached, which would make
 * an admin's own just-saved edit appear to silently fail to save when
 * they immediately look at the editor again. */
export async function adminGetTranslationOverrides(locale: string): Promise<Record<string, Json>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", `i18n_overrides_${locale}`)
    .maybeSingle();
  if (error) throw error;
  return (data?.value as Record<string, Json>) ?? {};
}

/**
 * Applies a batch of edits to one locale's override blob in a single
 * read-modify-write (not a full overwrite, so concurrent edits to
 * different namespaces never clobber each other). `value: null` (or an
 * empty string) removes that key's override entirely -- "reset to
 * default" -- rather than storing an empty string that would otherwise
 * win over the real translated default.
 */
export async function adminUpdateTranslationOverrides(
  locale: string,
  updates: { path: string; value: string | null }[],
): Promise<void> {
  const current = await adminGetTranslationOverrides(locale);
  let next: Record<string, Json> = current;
  for (const { path, value } of updates) {
    next = (value && value.trim() ? setDeepValue(next, path, value) : deleteDeepValue(next, path)) as Record<
      string,
      Json
    >;
  }
  await adminUpsertSetting(`i18n_overrides_${locale}`, next, `Admin translation overrides (${locale})`);
}
