import { ChevronDown, Leaf, Star } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import { PriceDisplay } from "@/components/ui/price-display";
import { Badge } from "@/components/ui/badge";
import { categoryPlaceholderKey, placeholderImage } from "@/lib/media/placeholders";
import type { ProductWithImages } from "@/lib/services/catalog";
import { AddToCartButton } from "./add-to-cart-button";

/** Card background tones, cycling deterministically per product so a grid
 * reads as varied rather than uniform. */
const CARD_TONES = ["bg-brand-50", "bg-danger-bg", "bg-warning-bg", "bg-brand-100"];

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
  const tone = CARD_TONES[variant % CARD_TONES.length];

  return (
    // Three nested layers for the organic (non-rounded-rect) silhouette --
    // see the .card-organic-* comment in globals.css for why a mask'd
    // shape needs this instead of a plain box-shadow/border.
    <div className="card-organic-shadow group">
      <div className="card-organic-border">
        <div className={`card-organic-surface flex flex-col p-4 sm:p-5 ${tone}`}>
          <Link href={`/p/${product.slug}`} className="relative block pb-2">
            {/* Large product-visual "stage" -- no circle, no rectangular
                photo box. The panel itself is shaped by the
                --card-image-mask data-URI (organic top corners + a
                genuinely wavy bottom edge), and its own filter:drop-shadow
                (not box-shadow, which the mask would cut away) lets
                the shadow spill past that wavy edge onto the content
                below, so the photo reads as sitting above/emerging from
                the card rather than inset in a flat box. Deliberately
                sized via its OWN aspect-ratio (scales with card width),
                exactly like the card's total height always has, rather
                than a synthetic "lock the total, then split it" scheme:
                that was tried and, since card width grows continuously
                (not just at the sm/md breakpoints) while the content
                section below has a roughly fixed pixel height, a single
                aspect-ratio for the whole card could only match the
                original total height at the one width it was calibrated
                for -- it drifted (and once badly overflowed the content
                section) at every other width. aspect-[5/4] (up from
                4/3) plus the tightened gaps in the content section below
                together land within a few px of the original total
                height across the whole practical width range, not just
                at a few sampled breakpoints. */}
            <div className="relative aspect-[5/4] w-full">
              {/* -bottom-3 (not inset-0's plain bottom-0): extends the
                  masked photo 0.75rem past the stage's own bottom edge --
                  through the Link's pb-2 gap and right up to where the
                  product name's own box starts (measured: 0px gap
                  remaining) -- without changing the stage's own
                  aspect-ratio, the card's height, or where the content
                  section below starts. The mask's `mask-size: 100% 100%`
                  just stretches the same wave shape to fit this very
                  slightly taller box. */}
              <div className="card-image-shadow absolute inset-x-0 top-0 -bottom-3">
                <div className="card-image-mask absolute inset-0 overflow-hidden bg-white/60">
                  {/* scale-110 + object-[center_65%] (not plain
                      object-cover): the sourced product photos are
                      transparent PNGs with a soft, semi-transparent fade
                      around the actual subject, so even with the mask
                      box now extended to its full available height (see
                      the -bottom-3 note above), the last stretch of that
                      box was showing mostly faded edge rather than
                      solid subject. Zooming in 10% and biasing the crop
                      toward the lower 65% (vs. object-cover's default
                      centered 50%) crops that fade away on every edge,
                      so the dense part of the photo reaches the wavy
                      bottom edge instead of just the box doing so. */}
                  <Image
                    src={primaryImage?.url ?? placeholderImage(fallbackKey, { variant })}
                    alt={pickLocalized(primaryImage?.alt_ar ?? name, primaryImage?.alt_en, locale)}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
                    className="scale-110 object-cover object-[center_65%]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                  {!product.is_available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
                      <Badge tone="danger">{t("outOfStock")}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {isBox && (
                <Badge tone="deep" className="absolute start-1 top-1 shadow-md">
                  {t("boxContents")}
                </Badge>
              )}
              {!isBox && product.is_available && (
                <Badge tone="surface" className="absolute start-1 top-1 shadow-md transition-transform duration-300 group-hover:-translate-y-0.5">
                  <Leaf className="h-3 w-3 text-brand-600" />
                  {t("freshBadge")}
                </Badge>
              )}
              {product.requires_reservation && (
                <Badge tone="info" className="absolute end-1 top-1 shadow-md">
                  {t("reservationRequired")}
                </Badge>
              )}
              <div className="pill-price absolute end-[12%] bottom-[10%] transition-transform duration-300 group-hover:-translate-y-0.5">
                <PriceDisplay value={product.price} locale={locale} size="sm" />
              </div>
            </div>
          </Link>

          {/* gap-1/pt-1 (down from gap-1.5/pt-2) is a deliberate, small
              trim of this stack's own internal whitespace -- not the
              name/rating/button/badge sizing themselves -- freeing a
              few px so the image above can grow without the card's
              total height visibly changing. */}
          <div className="flex flex-1 flex-col gap-1 pt-1 text-center">
            <Link href={`/p/${product.slug}`}>
              <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-deep-900 transition-colors group-hover:text-brand-700">
                {name}
              </h3>
            </Link>
            {product.rating != null && (
              <div className="flex items-center justify-center gap-1.5">
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

            {/* One unified pale-green action bar -- unit, Add to box, and
                the quick-add circle share a single pill-shaped surface
                instead of sitting as three separate free-floating
                controls. */}
            <div className="mt-auto flex items-center gap-1 rounded-full bg-white/50 p-1.5 shadow-[inset_0_1px_2px_rgba(14,27,20,0.08)]">
              {unit && (
                <span className="hidden shrink-0 items-center gap-0.5 rounded-full bg-white/90 px-2.5 py-2 text-xs font-bold whitespace-nowrap text-deep-800 shadow-sm sm:inline-flex">
                  {unit}
                  <ChevronDown className="h-3 w-3 text-muted-2" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <AddToCartButton productId={product.id} disabled={!product.is_available} />
              </div>
              <AddToCartButton productId={product.id} disabled={!product.is_available} compact />
            </div>
          </div>
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
