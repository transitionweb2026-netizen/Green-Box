import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

/**
 * Dynamic sitemap covering both locales for the home page, every active
 * category, and every available product -- generated from live data, not
 * a static list. See PROJECT_SPEC.md, SEO.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://greenbox.example";
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("slug, updated_at").eq("is_active", true),
    supabase.from("products").select("slug, updated_at").eq("is_available", true),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    entries.push({ url: `${base}/${locale}`, changeFrequency: "daily", priority: 1 });
    for (const category of categories ?? []) {
      entries.push({
        url: `${base}/${locale}/c/${category.slug}`,
        lastModified: category.updated_at,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const product of products ?? []) {
      entries.push({
        url: `${base}/${locale}/p/${product.slug}`,
        lastModified: product.updated_at,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
