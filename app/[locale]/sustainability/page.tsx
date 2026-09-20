import type { Metadata } from "next";
import { Droplets, Recycle, Sprout } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui/section-header";
import { getSetting, type SustainabilityContent } from "@/lib/services/content";
import { pickLocalizedOrDefault } from "@/lib/i18n/localized";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sustainabilityPage");
  return { title: t("title") };
}

export default async function SustainabilityPage() {
  const t = await getTranslations("sustainabilityPage");
  const locale = await getLocale();
  const content = await getSetting<SustainabilityContent>("sustainability_content");
  const cms = (ar?: string, en?: string, fallback?: string) => pickLocalizedOrDefault(ar, en, locale, fallback ?? "");

  const pillars = [
    {
      icon: Sprout,
      title: cms(content?.pillar1Title_ar, content?.pillar1Title_en, t("pillar1Title")),
      body: cms(content?.pillar1Body_ar, content?.pillar1Body_en, t("pillar1Body")),
    },
    {
      icon: Recycle,
      title: cms(content?.pillar2Title_ar, content?.pillar2Title_en, t("pillar2Title")),
      body: cms(content?.pillar2Body_ar, content?.pillar2Body_en, t("pillar2Body")),
    },
    {
      icon: Droplets,
      title: cms(content?.pillar3Title_ar, content?.pillar3Title_en, t("pillar3Title")),
      body: cms(content?.pillar3Body_ar, content?.pillar3Body_en, t("pillar3Body")),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
      <SectionHeader
        as="h1"
        eyebrow={t("eyebrow")}
        title={cms(content?.heading_ar, content?.heading_en, t("title"))}
        description={cms(content?.body_ar, content?.body_en, t("body"))}
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="card-blob bg-brand-50 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-[var(--shadow-soft)]">
              <pillar.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-bold text-deep-900">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
