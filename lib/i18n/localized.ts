/**
 * Fallback-to-Arabic rule for bilingual business data (as opposed to UI
 * strings, which go through next-intl) -- see ARCHITECTURE.md,
 * Internationalization. `*_ar` columns are NOT NULL in the database;
 * `*_en` is optional and filled in incrementally by the admin.
 */
export function pickLocalized(ar: string, en: string | null | undefined, locale: string): string {
  if (locale === "en" && en && en.trim()) return en;
  return ar;
}

export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(amount);
}
