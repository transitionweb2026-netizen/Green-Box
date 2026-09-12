import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBoxContents, getProductBySlug, listRelatedProducts } from "@/lib/services/catalog";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { ProductPurchaseForm } from "@/components/storefront/product-purchase-form";
import { ProductCard } from "@/components/storefront/product-card";

interface PageProps {
  params: Promise<{ productSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const locale = await getLocale();
  const product = await getProductBySlug(productSlug);
  if (!product) return {};
  const name = pickLocalized(product.name_ar, product.name_en, locale);
  const description = pickLocalized(product.description_ar ?? "", product.description_en, locale);
  const image = product.product_images[0]?.url;
  return {
    title: pickLocalized(product.meta_title_ar ?? product.name_ar, product.meta_title_en ?? product.name_en, locale) || name,
    description: pickLocalized(product.meta_description_ar ?? "", product.meta_description_en, locale) || description || undefined,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { productSlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("product");

  const product = await getProductBySlug(productSlug);
  if (!product) notFound();

  const [related, boxContents] = await Promise.all([
    listRelatedProducts(product.category_id, product.id),
    product.product_type === "box" ? getBoxContents(product.id) : Promise.resolve([]),
  ]);

  const name = pickLocalized(product.name_ar, product.name_en, locale);
  const description = pickLocalized(product.description_ar ?? "", product.description_en, locale);
  const unit = pickLocalized(product.unit_label_ar ?? "", product.unit_label_en, locale);
  const primaryImage = product.product_images.find((img) => img.is_primary) ?? product.product_images[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || undefined,
    image: product.product_images.map((img) => img.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "EGP",
      price: product.price,
      availability: product.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {product.categories && (
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <Link href={`/c/${product.categories.slug}`} className="hover:text-brand-700">
            {pickLocalized(product.categories.name_ar, product.categories.name_en, locale)}
          </Link>
        </nav>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-brand-50">
          {primaryImage ? (
            <Image src={primaryImage.url} alt={name} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">{t("noImage")}</div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          {unit && <p className="mt-1 text-sm text-muted">{unit}</p>}
          <p className="mt-4 text-2xl font-semibold text-brand-700">{formatPrice(product.price, locale)}</p>

          {!product.is_available && (
            <p className="mt-2 inline-block rounded-full bg-danger/10 px-3 py-1 text-sm font-medium text-danger">
              {t("outOfStock")}
            </p>
          )}

          <div className="mt-6">
            <ProductPurchaseForm productId={product.id} disabled={!product.is_available} />
          </div>

          {description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">{t("description")}</h2>
              <p className="mt-2 whitespace-pre-line text-muted">{description}</p>
            </div>
          )}

          {boxContents.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">{t("boxContents")}</h2>
              <ul className="mt-2 space-y-1 text-muted">
                {boxContents.map((entry) => (
                  <li key={entry.id}>
                    {pickLocalized(entry.item.name_ar, entry.item.name_en, locale)} × {entry.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-foreground">{t("related")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
