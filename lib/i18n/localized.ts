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

/**
 * Same fallback-to-Arabic rule as pickLocalized, but for CMS content
 * (lib/services/content.ts) where both ar/en fields are optional -- an
 * admin-supplied override is used when present, otherwise the caller's
 * default (normally a next-intl translation) so an untouched CMS field
 * never renders as blank.
 */
export function pickLocalizedOrDefault(
  ar: string | null | undefined,
  en: string | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (locale === "en" && en && en.trim()) return en;
  if (ar && ar.trim()) return ar;
  return fallback;
}

/**
 * Opposite fallback rule from pickLocalizedOrDefault: never crosses
 * languages. Only the current locale's own field is used, falling back to
 * `fallback` (normally a next-intl translation, already locale-correct)
 * when THAT field is empty -- so an Arabic-only admin override can never
 * leak onto the English site. Use this for identity strings like a brand
 * name that must switch with locale, as opposed to CMS body copy (where
 * pickLocalizedOrDefault's Arabic-first fallback is the intended
 * behavior, since Arabic content is always expected to exist there).
 */
export function pickStrictLocalized(
  ar: string | null | undefined,
  en: string | null | undefined,
  locale: string,
  fallback: string,
): string {
  const value = locale === "en" ? en : ar;
  return value && value.trim() ? value : fallback;
}

export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(amount);
}
