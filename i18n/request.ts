import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Resolves the active locale from the `[locale]` root parameter (see
 * ARCHITECTURE.md, Internationalization) using `next/root-params` rather
 * than the deprecated `requestLocale` field on getRequestConfig's params,
 * per next-intl's Next.js 16 migration guidance.
 */
export default getRequestConfig(async () => {
  const paramValue = await rootParams.locale();

  let locale: (typeof routing.locales)[number];
  if (hasLocale(routing.locales, paramValue)) {
    locale = paramValue;
  } else {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
