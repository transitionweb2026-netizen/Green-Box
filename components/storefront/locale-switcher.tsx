"use client";

import { Languages } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("common");
  const otherLocale = routing.locales.find((candidate) => candidate !== locale)!;
  const query = Object.fromEntries(searchParams.entries());

  return (
    <Link
      href={Object.keys(query).length > 0 ? { pathname, query } : pathname}
      locale={otherLocale}
      className="flex h-10 items-center gap-1.5 rounded-xl border border-border-strong bg-white/70 px-3 text-sm font-semibold text-deep-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
    >
      <Languages className="h-4 w-4" strokeWidth={2} />
      {otherLocale === "ar" ? t("switchToArabic") : t("switchToEnglish")}
    </Link>
  );
}
