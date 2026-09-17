import { getLocale, getTranslations } from "next-intl/server";
import { getSetting, type TermsContent } from "@/lib/services/content";
import { pickLocalizedOrDefault } from "@/lib/i18n/localized";

/**
 * Sitewide Terms & Conditions blurb, stacked directly under FaqSection
 * (both sit above the footer on every page -- see app/[locale]/layout.tsx).
 * Content is admin-editable (Content -> "الشروط والأحكام" in
 * /admin/content); ships with an honest placeholder rather than fabricated
 * legal text.
 */
export async function TermsSection() {
  const t = await getTranslations("terms");
  const locale = await getLocale();
  const content = await getSetting<TermsContent>("terms_content");
  const body = pickLocalizedOrDefault(content?.body_ar, content?.body_en, locale, t("body"));

  return (
    <section className="bg-background border-t border-border py-12">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-serif text-xl font-bold text-deep-800 sm:text-2xl">{t("title")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </section>
  );
}
