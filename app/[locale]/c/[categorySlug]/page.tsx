import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCategoryBySlug, listProducts } from "@/lib/services/catalog";
import { pickLocalized } from "@/lib/i18n/localized";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
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

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const { page: pageParam } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("categoryPage");

  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const { products, total, pageSize } = await listProducts({ categoryId: category.id, page, pageSize: 24 });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <SectionHeader
        as="h1"
        title={pickLocalized(category.name_ar, category.name_en, locale)}
        description={
          category.description_ar
            ? pickLocalized(category.description_ar, category.description_en, locale)
            : undefined
        }
        action={
          total > 0 ? (
            <span className="text-sm font-medium text-muted">{t("productsCount", { count: total })}</span>
          ) : undefined
        }
      />

      {products.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<PackageSearch className="h-7 w-7" />}
          title={t("empty")}
          action={
            <Link href="/c" className={buttonVariants({ variant: "outline" })}>
              {t("browseAll")}
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {products.map((product) => (
              <div key={product.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            rtl={locale === "ar"}
            makeHref={(p) => `?page=${p}`}
          />
        </>
      )}
    </div>
  );
}
