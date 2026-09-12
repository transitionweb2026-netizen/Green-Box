import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getCategoryBySlug, listProducts } from "@/lib/services/catalog";
import { pickLocalized } from "@/lib/i18n/localized";
import { ProductCard } from "@/components/storefront/product-card";
import { Card } from "@/components/ui/card";

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{pickLocalized(category.name_ar, category.name_en, locale)}</h1>
      {category.description_ar && (
        <p className="mt-2 max-w-2xl text-muted">{pickLocalized(category.description_ar, category.description_en, locale)}</p>
      )}

      {products.length === 0 ? (
        <Card className="mt-8 text-center text-muted">{t("empty")}</Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?page=${p}`}
                  aria-current={p === page ? "page" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm ${
                    p === page ? "border-brand-600 bg-brand-600 text-white" : "border-border text-foreground hover:bg-brand-50"
                  }`}
                >
                  {p}
                </a>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
