import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSetting, type FaqContent } from "@/lib/services/content";
import { pickLocalizedOrDefault } from "@/lib/i18n/localized";
import { LeafBadge } from "@/components/ui/leaf-badge";

/**
 * Sitewide FAQ teaser shown right above the footer on every page (see
 * app/[locale]/layout.tsx) -- content is admin-editable (Content ->
 * "الأسئلة الشائعة" in /admin/content) with a translated fallback for any
 * field the admin hasn't filled in yet, same pattern as the homepage's
 * promo sections.
 */
export async function FaqSection() {
  const t = await getTranslations("faq");
  const locale = await getLocale();
  const content = await getSetting<FaqContent>("faq_content");
  const cms = (ar?: string, en?: string, fallback?: string) => pickLocalizedOrDefault(ar, en, locale, fallback ?? "");

  const items = [
    { q: cms(content?.question1_ar, content?.question1_en, t("question1")), a: cms(content?.answer1_ar, content?.answer1_en, t("answer1")) },
    { q: cms(content?.question2_ar, content?.question2_en, t("question2")), a: cms(content?.answer2_ar, content?.answer2_en, t("answer2")) },
    { q: cms(content?.question3_ar, content?.question3_en, t("question3")), a: cms(content?.answer3_ar, content?.answer3_en, t("answer3")) },
  ];

  return (
    <section className="bg-background border-t border-border py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <LeafBadge>{t("title")}</LeafBadge>

        <div className="mt-10 grid gap-8 text-start sm:grid-cols-3 sm:gap-6 sm:text-center">
          {items.map((item) => (
            <div key={item.q}>
              <h3 className="font-serif text-lg font-bold text-deep-800">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>

        <Link
          href="/c"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-gold-400 px-7 py-3 text-sm font-bold text-deep-900 transition-colors hover:bg-gold-500"
        >
          {cms(content?.ctaLabel_ar, content?.ctaLabel_en, t("cta"))}
        </Link>
      </div>
    </section>
  );
}
