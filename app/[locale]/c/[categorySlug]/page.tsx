import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getCategoryBySlug, listActiveCategories, listProducts } from "@/lib/services/catalog";
import { pickLocalized } from "@/lib/i18n/localized";
import { CategoryProductGridView } from "@/components/storefront/category-product-grid-view";
import { CategoryProductGrid } from "@/components/storefront/category-product-grid";

// Static/ISR per Phase 1 item 4: every category page is pre-rendered per
// locale+slug (generateStaticParams below) and revalidated every 5
// minutes; `dynamic = 'error'` fails the build loudly if anything here
// ever (re)introduces a dynamic API, instead of silently falling back to
// per-request rendering the way it used to with `searchParams` read
// directly in this component. Pagination beyond page 1 now lives in
// CategoryProductGrid, a client component reading useSearchParams --
// see that file's doc comment for why.
export const dynamic = "error";
export const revalidate = 300;

const PAGE_SIZE = 24;

export async function generateStaticParams() {
  const categories = await listActiveCategories();
  return categories.map((category) => ({ categorySlug: category.slug }));
}

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const locale = await getLocale();
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return {};
  const name = pickLocalized(category.name_ar, category.name_en, locale);
  return {
    title: pickLocalized(category.meta_title_ar ?? category.name_ar, category.meta_title_en ?? category.name_en, locale) || name,
    description: pickLocalized(category.meta_description_ar ?? "", category.meta_description_en, locale) || undefined,
    alternates: {
      canonical: `/${locale}/c/${categorySlug}`,
      languages: { ar: `/ar/c/${categorySlug}`, en: `/en/c/${categorySlug}` },
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("categoryPage");
  const productT = await getTranslations("product");

  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const firstPage = await listProducts({ categoryId: category.id, page: 1, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(firstPage.total / firstPage.pageSize));
  const title = pickLocalized(category.name_ar, category.name_en, locale);
  const description = category.description_ar ? pickLocalized(category.description_ar, category.description_en, locale) : undefined;
  const countLabel = firstPage.total > 0 ? t("productsCount", { count: firstPage.total }) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <Suspense
        fallback={
          <CategoryProductGridView
            products={firstPage.products}
            page={1}
            totalPages={totalPages}
            locale={locale}
            productT={productT}
            title={title}
            description={description}
            countLabel={countLabel}
            emptyLabel={t("empty")}
            browseAllLabel={t("browseAll")}
          />
        }
      >
        <CategoryProductGrid
          categoryId={category.id}
          pageSize={PAGE_SIZE}
          initialPage={firstPage}
          title={title}
          description={description}
          countLabel={countLabel}
        />
      </Suspense>
    </div>
  );
}
