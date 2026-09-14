import { Search, SearchX } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { countSearchProducts, searchProducts } from "@/lib/services/catalog";
import { SearchBox } from "@/components/storefront/search-box";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const t = await getTranslations("search");
  return {
    title: q ? `${t("resultsFor")} "${q}"` : t("placeholder"),
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", page: pageParam } = await searchParams;
  const t = await getTranslations("search");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  const page = Math.max(1, Number(pageParam) || 1);
  const trimmed = q.trim();

  const [products, total] = trimmed
    ? await Promise.all([
        searchProducts(trimmed, undefined, PAGE_SIZE, (page - 1) * PAGE_SIZE),
        countSearchProducts(trimmed),
      ])
    : [[], 0];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <h1 className="sr-only">{tNav("search")}</h1>
      <div className="mx-auto max-w-xl">
        <SearchBox initialQuery={q} />
      </div>

      {trimmed && (
        <p className="mt-6 text-center text-sm text-muted">
          {t("resultsFor")} <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
          {total > 0 && ` · ${total}`}
        </p>
      )}

      <div className="mt-8">
        {!trimmed ? (
          <EmptyState icon={<Search className="h-7 w-7" />} title={t("placeholder")} />
        ) : products.length === 0 ? (
          <EmptyState icon={<SearchX className="h-7 w-7" />} title={t("noResults")} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              rtl={locale === "ar"}
              makeHref={(p) => `?q=${encodeURIComponent(q)}&page=${p}`}
            />
          </>
        )}
      </div>
    </div>
  );
}
