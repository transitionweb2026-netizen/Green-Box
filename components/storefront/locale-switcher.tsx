"use client";

import { Suspense } from "react";
import { Languages } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const linkClassName =
  "flex h-10 items-center gap-1.5 rounded-xl border border-border-strong bg-white/70 px-3 text-sm font-semibold text-deep-700 transition-colors hover:border-brand-400 hover:bg-brand-50";

function LocaleSwitcherLink({ query }: { query?: Record<string, string> }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const otherLocale = routing.locales.find((candidate) => candidate !== locale)!;

  return (
    <Link
      href={query && Object.keys(query).length > 0 ? { pathname, query } : pathname}
      locale={otherLocale}
      className={linkClassName}
    >
      <Languages className="h-4 w-4" strokeWidth={2} />
      {otherLocale === "ar" ? t("switchToArabic") : t("switchToEnglish")}
    </Link>
  );
}

/** The part that actually needs the current query string (so switching
 * locale keeps e.g. ?page=2 instead of dropping it) -- useSearchParams()
 * requires a Suspense boundary around it in any statically/ISR-rendered
 * route (every storefront page, per Phase 1), hence the split below. */
function LocaleSwitcherWithQuery() {
  const searchParams = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());
  return <LocaleSwitcherLink query={query} />;
}

/**
 * Rendered unconditionally in the shared header (site-header.tsx,
 * mobile-nav.tsx) on every page, so this provides its OWN Suspense
 * boundary rather than relying on each call site to remember one -- the
 * fallback is the exact same link, just without query-string
 * preservation (usePathname/useLocale/useTranslations don't need
 * Suspense, only useSearchParams does), so there's no layout shift and
 * the only thing briefly missing pre-hydration is carrying over query
 * params on the locale switch itself.
 */
export function LocaleSwitcher() {
  return (
    <Suspense fallback={<LocaleSwitcherLink />}>
      <LocaleSwitcherWithQuery />
    </Suspense>
  );
}
