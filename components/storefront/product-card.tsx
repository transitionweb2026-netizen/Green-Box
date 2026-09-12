import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import type { ProductWithImages } from "@/lib/services/catalog";
import { AddToCartButton } from "./add-to-cart-button";

export async function ProductCard({ product }: { product: ProductWithImages }) {
  const locale = await getLocale();
  const t = await getTranslations("product");
  const name = pickLocalized(product.name_ar, product.name_en, locale);
  const unit = pickLocalized(product.unit_label_ar ?? "", product.unit_label_en, locale);
  const primaryImage =
    product.product_images.find((img) => img.is_primary) ?? product.product_images[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background">
      <Link href={`/p/${product.slug}`} className="block">
        <div className="relative aspect-square w-full bg-brand-50">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={pickLocalized(primaryImage.alt_ar ?? name, primaryImage.alt_en, locale)}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">{t("noImage")}</div>
          )}
          {!product.is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <span className="rounded-full bg-danger px-3 py-1 text-sm font-medium text-white">
                {t("outOfStock")}
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/p/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium text-foreground hover:text-brand-700">{name}</h3>
        </Link>
        {unit && <p className="text-xs text-muted">{unit}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-semibold text-brand-700">{formatPrice(product.price, locale)}</span>
          <AddToCartButton productId={product.id} disabled={!product.is_available} compact />
        </div>
      </div>
    </div>
  );
}
