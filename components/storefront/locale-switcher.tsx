"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const otherLocale = routing.locales.find((candidate) => candidate !== locale)!;

  return (
    <Link
      href={pathname}
      locale={otherLocale}
      className="text-sm text-muted hover:text-foreground"
    >
      {otherLocale === "ar" ? t("switchToArabic") : t("switchToEnglish")}
    </Link>
  );
}
