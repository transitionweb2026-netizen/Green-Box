import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { getTranslationOverrides } from "@/lib/services/content";
import { deepMerge } from "@/lib/i18n/deep-object";

/**
 * Resolves the active locale from the `[locale]` root parameter (see
 * ARCHITECTURE.md, Internationalization) using `next/root-params` rather
 * than the deprecated `requestLocale` field on getRequestConfig's params,
 * per next-intl's Next.js 16 migration guidance.
 *
 * Every `t()` call sitewide is sourced from here, so this is also the
 * single integration point for the admin-editable translation-override
 * system (/admin/translations, see lib/services/content.ts's
 * getTranslationOverrides): the admin-entered overrides are deep-merged
 * on top of the real messages/{locale}.json, overrides winning, any
 * key the admin hasn't touched transparently falling through to its
 * static default -- a key can never end up blank just because it was
 * never edited.
 */
export default getRequestConfig(async () => {
  const paramValue = await rootParams.locale();

  let locale: (typeof routing.locales)[number];
  if (hasLocale(routing.locales, paramValue)) {
    locale = paramValue;
  } else {
    notFound();
  }

  const [defaultMessages, overrides] = await Promise.all([
    import(`../messages/${locale}.json`).then((mod) => mod.default),
    getTranslationOverrides(locale),
  ]);

  return {
    locale,
    messages: deepMerge(defaultMessages, overrides),
  };
});
