import { defineRouting } from "next-intl/routing";

/**
 * Storefront locales only. The admin dashboard intentionally sits outside
 * this routing (see ARCHITECTURE.md, Internationalization) and is not
 * localized through next-intl.
 */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
