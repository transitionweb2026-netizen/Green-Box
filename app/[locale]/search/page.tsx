import { getTranslations } from "next-intl/server";
import { searchProducts } from "@/lib/services/catalog";
import { SearchBox } from "@/components/storefront/search-box";
import { ProductCard } from "@/components/storefront/product-card";
import { Card } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const t = await getTranslations("search");

  const products = q.trim() ? await searchProducts(q) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchBox initialQuery={q} />

      {q.trim() && (
        <p className="mt-4 text-muted">
          {t("resultsFor")} &ldquo;{q}&rdquo;
        </p>
      )}

      {q.trim() && products.length === 0 ? (
        <Card className="mt-6 text-center text-muted">{t("noResults")}</Card>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
