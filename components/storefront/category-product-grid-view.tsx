import { PackageSearch } from "lucide-react";
import type { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCardView } from "@/components/storefront/product-card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import type { ProductWithImages } from "@/lib/services/catalog";

/**
 * Pure presentational grid+pagination, no hooks -- shared between the
 * category page's static server-rendered fallback (page 1, the common
 * case) and the client-rendered result for any other page (see
 * category-product-grid.tsx). Keeping both paths rendering through this
 * exact same component means a page-1 visitor's Suspense fallback and
 * final hydrated output are pixel-identical, so there's nothing visible
 * to "flash" between them even though React does swap one for the
 * other under the hood.
 */
export function CategoryProductGridView({
  products,
  page,
  totalPages,
  locale,
  productT,
  title,
  description,
  countLabel,
  emptyLabel,
  browseAllLabel,
}: {
  products: ProductWithImages[];
  page: number;
  totalPages: number;
  locale: string;
  /** "product" namespace translations -- ProductCardView takes these as a
   * prop instead of resolving them itself (see product-card.tsx), since
   * this view also has to render correctly from a client component. */
  productT: ReturnType<typeof useTranslations>;
  title: string;
  description?: string;
  countLabel?: string;
  emptyLabel: string;
  browseAllLabel: string;
}) {
  return (
    <>
      <SectionHeader
        as="h1"
        title={title}
        description={description}
        action={countLabel ? <span className="text-sm font-medium text-muted">{countLabel}</span> : undefined}
      />

      {products.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<PackageSearch className="h-7 w-7" />}
          title={emptyLabel}
          action={
            <Link href="/c" className={buttonVariants({ variant: "outline" })}>
              {browseAllLabel}
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {products.map((product) => (
              <div key={product.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
                <ProductCardView product={product} locale={locale} t={productT} />
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} rtl={locale === "ar"} makeHref={(p) => `?page=${p}`} />
        </>
      )}
    </>
  );
}
