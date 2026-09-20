import type { Metadata } from "next";
import { ChefHat, Clock, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listPublishedRecipes } from "@/lib/services/recipes";
import { pickLocalized } from "@/lib/i18n/localized";
import { placeholderImage } from "@/lib/media/placeholders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("recipesPage");
  return { title: t("title") };
}

export default async function RecipesPage() {
  const t = await getTranslations("recipesPage");
  const locale = await getLocale();
  const recipes = await listPublishedRecipes();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
      <SectionHeader as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />

      <div className="mt-10">
        {recipes.length === 0 ? (
          <EmptyState icon={<ChefHat className="h-7 w-7" />} title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => {
              const title = pickLocalized(recipe.title_ar, recipe.title_en, locale);
              const description = pickLocalized(recipe.description_ar ?? "", recipe.description_en, locale);
              return (
                <Link key={recipe.id} href={`/recipes/${recipe.slug}`} className="card-blob group block bg-brand-50 p-3">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.35rem] bg-white/50">
                    <Image
                      src={recipe.image_url || placeholderImage("kitchen", { width: 600, height: 450 })}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 pt-3">
                    <h3 className="line-clamp-2 font-bold text-deep-900 transition-colors group-hover:text-brand-700">{title}</h3>
                    {description && <p className="line-clamp-2 text-sm text-muted">{description}</p>}
                    <div className="mt-1 flex items-center gap-4 text-xs font-semibold text-muted-2">
                      {recipe.prep_minutes != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {t("prepMinutes", { count: recipe.prep_minutes })}
                        </span>
                      )}
                      {recipe.servings != null && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {t("servings", { count: recipe.servings })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
