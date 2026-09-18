import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, PackageCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBoxContents, getProductBySlug, listRecommendedProducts } from "@/lib/services/catalog";
import { pickLocalized } from "@/lib/i18n/localized";
import { getSiteOrigin } from "@/lib/seo/site-url";
import { categoryPlaceholderKey } from "@/lib/media/placeholders";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductPurchaseForm } from "@/components/storefront/product-purchase-form";
import { ProductGallery } from "@/components/storefront/product-gallery";
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
    alternates: {
      canonical: `/${locale}/p/${productSlug}`,
      languages: { ar: `/ar/p/${productSlug}`, en: `/en/p/${productSlug}` },
    },
    openGraph: {
      title: name,
      description: description || undefined,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: name,
      description: description || undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { productSlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("product");
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  const product = await getProductBySlug(productSlug);
  if (!product) notFound();

  const [related, boxContents] = await Promise.all([
    listRecommendedProducts(product.category_id, product.id),
    product.product_type === "box" ? getBoxContents(product.id) : Promise.resolve([]),
  ]);

  const name = pickLocalized(product.name_ar, product.name_en, locale);
  const description = pickLocalized(product.description_ar ?? "", product.description_en, locale);
  const unit = pickLocalized(product.unit_label_ar ?? "", product.unit_label_en, locale);
  const isBox = product.product_type === "box";

  const origin = await getSiteOrigin();
  const productJsonLd = {
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
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("backToCategory"), item: `${origin}/${locale}` },
      ...(product.categories
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: pickLocalized(product.categories.name_ar, product.categories.name_en, locale),
              item: `${origin}/${locale}/c/${product.categories.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.categories ? 3 : 2,
        name,
        item: `${origin}/${locale}/p/${product.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-brand-700">
          {t("backToCategory")}
        </Link>
        {product.categories && (
          <>
            <Chevron className="h-3.5 w-3.5" />
            <Link href={`/c/${product.categories.slug}`} className="hover:text-brand-700">
              {pickLocalized(product.categories.name_ar, product.categories.name_en, locale)}
            </Link>
          </>
        )}
        <Chevron className="h-3.5 w-3.5" />
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <ProductGallery
          images={product.product_images}
          alt={name}
          fallbackKey={isBox ? "greenBox" : categoryPlaceholderKey(product.categories?.slug)}
          boxLabel={isBox ? t("boxContents") : undefined}
        />

        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{name}</h1>
          {unit && <p className="mt-1.5 text-sm text-muted">{unit}</p>}
          {product.rating != null && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <div className="relative flex text-deep-100" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
                <div
                  className="absolute inset-0 flex overflow-hidden text-gold-500"
                  style={{ width: `${(Math.max(0, Math.min(5, product.rating)) / 5) * 100}%` }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 shrink-0 fill-current" />
                  ))}
                </div>
              </div>
              <span className="text-sm font-medium text-muted-2">
                {product.rating.toFixed(1)}
                {product.rating_count > 0 && ` (${product.rating_count})`}
              </span>
            </div>
          )}
          <div className="mt-4">
            <PriceDisplay value={product.price} locale={locale} size="lg" />
          </div>

          {(!product.is_available || product.requires_reservation) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!product.is_available && <Badge tone="danger">{t("outOfStock")}</Badge>}
              {product.requires_reservation && <Badge tone="info">{t("reservationRequired")}</Badge>}
            </div>
          )}

          <div className="mt-6">
            <ProductPurchaseForm
              productId={product.id}
              price={product.price}
              unit={unit || undefined}
              soldByWeight={product.sold_by_weight}
              disabled={!product.is_available}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted">
            <div className="glass flex flex-col items-center gap-1.5 !rounded-xl px-2 py-3">
              <Truck className="h-4 w-4 text-brand-600" />
              {t("trustDelivery")}
            </div>
            <div className="glass flex flex-col items-center gap-1.5 !rounded-xl px-2 py-3">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              {t("trustQuality")}
            </div>
            <div className="glass flex flex-col items-center gap-1.5 !rounded-xl px-2 py-3">
              <PackageCheck className="h-4 w-4 text-brand-600" />
              {t("trustPacking")}
            </div>
          </div>

          {description && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-foreground">{t("description")}</h2>
              <p className="mt-2 whitespace-pre-line text-muted">{description}</p>
            </div>
          )}

          {boxContents.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-foreground">{t("boxContents")}</h2>
              <ul className="mt-3 space-y-2">
                {boxContents.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-white/60 px-3.5 py-2.5 text-sm"
                  >
                    <span className="text-foreground">{pickLocalized(entry.item.name_ar, entry.item.name_en, locale)}</span>
                    <Badge tone="brand">×{entry.quantity}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <SectionHeader title={t("related")} />
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {related.map((item) => (
              <div key={item.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
