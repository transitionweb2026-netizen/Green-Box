import { Leaf, Star } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import { PriceDisplay } from "@/components/ui/price-display";
import { Badge } from "@/components/ui/badge";
import { categoryPlaceholderKey, placeholderImage } from "@/lib/media/placeholders";
import type { ProductWithImages } from "@/lib/services/catalog";
import { AddToCartButton } from "./add-to-cart-button";

/** Soft pastel backdrops the photo appears to float above, cycling
 * deterministically per product so a grid of cards reads as varied rather
 * than uniform -- all four are existing design tokens (brand/warning/danger
 * surface tints), not new colors invented for this. */
const BLOB_TONES = ["bg-brand-50", "bg-danger-bg", "bg-warning-bg", "bg-brand-100"];

export async function ProductCard({ product }: { product: ProductWithImages }) {
  const locale = await getLocale();
  const t = await getTranslations("product");
  const name = pickLocalized(product.name_ar, product.name_en, locale);
  const unit = pickLocalized(product.unit_label_ar ?? "", product.unit_label_en, locale);
  const primaryImage =
    product.product_images.find((img) => img.is_primary) ?? product.product_images[0];
  const isBox = product.product_type === "box";
  const fallbackKey = isBox ? "greenBox" : categoryPlaceholderKey(product.categories?.slug);
  const variant = hashVariant(product.id);

  return (
    <div className={`card-blob group flex flex-col p-3 sm:p-4 ${BLOB_TONES[variant % BLOB_TONES.length]}`}>
      <Link href={`/p/${product.slug}`} className="relative block">
        <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] bg-white/50">
          <Image
            src={primaryImage?.url ?? placeholderImage(fallbackKey, { variant })}
            alt={pickLocalized(primaryImage?.alt_ar ?? name, primaryImage?.alt_en, locale)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {isBox && (
            <Badge tone="deep" className="absolute start-2 top-2">
              {t("boxContents")}
            </Badge>
          )}
          {product.is_featured && !isBox && (
            <Badge tone="surface" className="absolute start-2 top-2">
              <Leaf className="h-3 w-3 text-brand-600" />
              {t("freshBadge")}
            </Badge>
          )}
          {product.requires_reservation && (
            <Badge tone="info" className="absolute end-2 top-2">
              {t("reservationRequired")}
            </Badge>
          )}
          {!product.is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
              <Badge tone="danger">{t("outOfStock")}</Badge>
            </div>
          )}
          <div className="pill-price absolute bottom-2 end-2">
            <PriceDisplay value={product.price} locale={locale} size="sm" />
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 pt-3">
        <Link href={`/p/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-deep-900 transition-colors group-hover:text-brand-700">
            {name}
          </h3>
        </Link>
        {product.rating != null && (
          <div className="flex items-center gap-1.5">
            <div className="relative flex text-deep-100" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
              <div
                className="absolute inset-0 flex overflow-hidden text-gold-500"
                style={{ width: `${(Math.max(0, Math.min(5, product.rating)) / 5) * 100}%` }}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 shrink-0 fill-current" />
                ))}
              </div>
            </div>
            <span className="text-xs font-medium text-muted-2">
              {product.rating.toFixed(1)}
              {product.rating_count > 0 && ` ${t("ratingCount", { count: product.rating_count })}`}
            </span>
          </div>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-2">
          {unit && (
            <span className="hidden shrink-0 rounded-full border border-border-strong bg-white/80 px-3 py-2.5 text-xs font-bold whitespace-nowrap text-deep-800 sm:inline-block">
              {unit}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <AddToCartButton productId={product.id} disabled={!product.is_available} />
          </div>
          <AddToCartButton productId={product.id} disabled={!product.is_available} compact />
        </div>
      </div>
    </div>
  );
}

/** Deterministic 0-4 variant index from a product id, so different
 * products missing a real photo don't all show the exact same
 * placeholder frame. */
function hashVariant(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 5;
  return hash;
}
