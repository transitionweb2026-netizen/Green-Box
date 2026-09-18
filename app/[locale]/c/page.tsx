import { AppImage as Image } from "@/components/ui/app-image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listActiveCategories } from "@/lib/services/catalog";
import { pickLocalized } from "@/lib/i18n/localized";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { placeholderImage } from "@/lib/media/placeholders";
import { LayoutGrid } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("categories") };
}

export default async function CategoriesIndexPage() {
  const t = await getTranslations("nav");
  const tHome = await getTranslations("home");
  const locale = await getLocale();
  const categories = await listActiveCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <SectionHeader as="h1" eyebrow={t("categories")} title={tHome("categoriesTitle")} description={tHome("categoriesSubtitle")} />

      <div className="mt-8">
        {categories.length === 0 ? (
          <EmptyState icon={<LayoutGrid className="h-7 w-7" />} title={tHome("categoriesComingSoon")} />
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, i) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="glass glass-hover group flex w-[calc(50%-0.5rem)] flex-col items-center gap-4 !rounded-2xl px-4 py-8 text-center sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]"
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-white transition-transform group-hover:scale-105">
                  <Image
                    src={category.image_url || placeholderImage("vegetables", { width: 240, height: 240, variant: i })}
                    alt={pickLocalized(category.name_ar, category.name_en, locale)}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <span className="font-bold text-foreground">{pickLocalized(category.name_ar, category.name_en, locale)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
