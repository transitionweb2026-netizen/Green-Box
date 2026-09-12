import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listActiveCategories } from "@/lib/services/catalog";
import { pickLocalized } from "@/lib/i18n/localized";

export default async function CategoriesIndexPage() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const categories = await listActiveCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("categories")}</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/c/${category.slug}`}
            className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 text-center hover:border-brand-400 hover:bg-brand-50"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-brand-50">
              {category.image_url && (
                <Image
                  src={category.image_url}
                  alt={pickLocalized(category.name_ar, category.name_en, locale)}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <span className="font-medium text-foreground">{pickLocalized(category.name_ar, category.name_en, locale)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
