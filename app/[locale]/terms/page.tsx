import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui/section-header";
import { getSetting, type TermsContent } from "@/lib/services/content";
import { pickLocalizedOrDefault } from "@/lib/i18n/localized";

export const dynamic = "error";
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("termsPage");
  return { title: t("title"), description: t("metaDescription") };
}

/**
 * The admin-authored body is one plain-text field (see TermsContentForm),
 * written as "N. Title" on its own line followed by that point's
 * description, with a blank line between points -- the same shape the
 * client's own source document used. Parsed here into {title, body} pairs
 * purely for display, rather than turning this into a repeatable-item CMS
 * field: there's exactly one Terms document, not a list an admin adds to
 * over time, so a second textarea (ar/en) stays the simplest honest
 * editing surface for it.
 */
function parseTermsItems(text: string): { title: string; body: string }[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [firstLine, ...rest] = block.split("\n");
      return {
        title: firstLine.replace(/^\d+[.)]\s*/, "").trim(),
        body: rest.join(" ").trim(),
      };
    });
}

export default async function TermsPage() {
  const t = await getTranslations("termsPage");
  const locale = await getLocale();
  const content = await getSetting<TermsContent>("terms_content");
  const body = pickLocalizedOrDefault(content?.body_ar, content?.body_en, locale, t("fallbackNotice"));
  const items = parseTermsItems(body);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <SectionHeader as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />

      {items.length <= 1 ? (
        <p className="mt-10 text-center text-sm leading-relaxed text-muted">{body}</p>
      ) : (
        <ol className="mt-10 space-y-6">
          {items.map((item, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="font-bold text-deep-900">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
