import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Sitewide Terms & Conditions teaser, stacked directly under FaqSection
 * (both sit above the footer on every page -- see app/[locale]/layout.tsx).
 * Just a title + one line + a link to the real /terms page now -- the full
 * 11-point policy text (admin-editable, Content -> "الشروط والأحكام" in
 * /admin/content) is real legal/operational content, not a short blurb, so
 * it lives on its own page instead of repeating on every single page.
 */
export async function TermsSection() {
  const t = await getTranslations("terms");

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-serif text-xl font-bold text-deep-800 sm:text-2xl">{t("title")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("teaser")}</p>
        <Link href="/terms" className="mt-4 inline-block text-sm font-bold text-brand-700 hover:underline">
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
