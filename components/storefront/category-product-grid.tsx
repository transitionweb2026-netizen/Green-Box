"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CategoryProductGridView } from "./category-product-grid-view";
import { fetchCategoryProductsPageAction } from "@/app/[locale]/c/actions";
import type { ProductPage } from "@/lib/services/catalog";

/**
 * Isolates the ONLY searchParams-dependent part of the category page
 * (see app/[locale]/c/[categorySlug]/page.tsx) so the page itself never
 * reads searchParams -- that alone would force it to render dynamically
 * on every request, with no revalidate/ISR, regardless of
 * generateStaticParams. Must be wrapped in <Suspense> by its caller
 * (required for any component calling useSearchParams in a
 * static/ISR'd route) with a fallback rendering the server's own page-1
 * data through this exact same CategoryProductGridView -- so a page-1
 * visitor (the overwhelming common case, no ?page= at all) hydrates
 * into pixel-identical markup, nothing to visibly flash. Only a direct
 * link to ?page=2+ briefly shows the page-1 fallback while this fetches
 * the real page client-side.
 */
export function CategoryProductGrid({
  categoryId,
  pageSize,
  initialPage,
  title,
  description,
  countLabel,
}: {
  categoryId: string;
  pageSize: number;
  initialPage: ProductPage;
  title: string;
  description?: string;
  /** Pre-formatted "N products" string for page 1 -- recomputed for
   * other pages from categoryPage's own `t` below. */
  countLabel?: string;
}) {
  const locale = useLocale();
  const productT = useTranslations("product");
  const t = useTranslations("categoryPage");
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [data, setData] = useState<ProductPage>(initialPage);
  // Going back to the page the server already rendered needs no network
  // round trip -- adjusted during render (same pattern cart-item-row.tsx
  // uses for syncing state to a changed value) rather than in the effect
  // below, so there's no pointless extra render through setState-in-effect.
  const [prevPage, setPrevPage] = useState(page);
  if (page !== prevPage) {
    setPrevPage(page);
    if (page === initialPage.page) setData(initialPage);
  }

  useEffect(() => {
    if (page === initialPage.page) return;
    let cancelled = false;
    fetchCategoryProductsPageAction(categoryId, page, pageSize).then((fresh) => {
      if (!cancelled) setData(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, [page, categoryId, pageSize, initialPage]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <CategoryProductGridView
      products={data.products}
      page={data.page}
      totalPages={totalPages}
      locale={locale}
      productT={productT}
      title={title}
      description={description}
      countLabel={data.page === initialPage.page ? countLabel : data.total > 0 ? t("productsCount", { count: data.total }) : undefined}
      emptyLabel={t("empty")}
      browseAllLabel={t("browseAll")}
    />
  );
}
