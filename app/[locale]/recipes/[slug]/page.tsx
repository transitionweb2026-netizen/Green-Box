import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { getPublishedRecipeBySlug } from "@/lib/services/recipes";
import { pickLocalized } from "@/lib/i18n/localized";
import { placeholderImage } from "@/lib/media/placeholders";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const recipe = await getPublishedRecipeBySlug(slug);
  if (!recipe) return {};
  return { title: pickLocalized(recipe.title_ar, recipe.title_en, locale) };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("recipesPage");
  const locale = await getLocale();
  const recipe = await getPublishedRecipeBySlug(slug);
  if (!recipe) notFound();

  const title = pickLocalized(recipe.title_ar, recipe.title_en, locale);
  const description = pickLocalized(recipe.description_ar ?? "", recipe.description_en, locale);
  const ingredients = pickLocalized(recipe.ingredients_ar ?? "", recipe.ingredients_en, locale)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const steps = pickLocalized(recipe.steps_ar ?? "", recipe.steps_en, locale)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
      <Link href="/recipes" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
        {t("backToRecipes")}
      </Link>

      <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-[2rem] shadow-[var(--shadow-lifted)]">
        <Image
          src={recipe.image_url || placeholderImage("kitchen", { width: 1200, height: 675 })}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 900px"
          className="object-cover"
        />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold text-deep-900 sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-muted">{description}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-deep-700">
        {recipe.prep_minutes != null && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {t("prepMinutes", { count: recipe.prep_minutes })}
          </span>
        )}
        {recipe.servings != null && (
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {t("servings", { count: recipe.servings })}
          </span>
        )}
      </div>

      <div className="mt-10 grid gap-10 sm:grid-cols-[1fr_1.4fr]">
        {ingredients.length > 0 && (
          <div>
            <h2 className="font-bold text-deep-900">{t("ingredientsTitle")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {ingredients.map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        {steps.length > 0 && (
          <div>
            <h2 className="font-bold text-deep-900">{t("stepsTitle")}</h2>
            <ol className="mt-3 space-y-3 text-sm text-foreground">
              {steps.map((line, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{line}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-12">
        <Link href="/c" className={buttonVariants({ variant: "box" })}>
          {t("shopIngredientsCta")}
        </Link>
      </div>
    </div>
  );
}
