"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { getHeroCartSummaryAction } from "./account-cart-state";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { categoryPlaceholderKey, placeholderImage } from "@/lib/media/placeholders";
import { cn } from "@/lib/utils/cn";
import type { CartSummary } from "@/lib/services/cart";

const EMPTY_SUMMARY: CartSummary = { items: [], itemCount: 0, subtotal: 0 };

/**
 * The homepage hero's floating "Your Box" widget. Was an async Server
 * Component calling getCartSummaryForCurrentUser() (cookie-based) --
 * rendered on every request regardless of the hidden xl:block wrapper
 * around it, this was one of the two calls (with SiteHeader's
 * getCurrentUser()) that forced the whole homepage into dynamic
 * rendering. Now a client component: the empty-cart state still renders
 * in the initial SSR'd HTML (client components are server-rendered for
 * the first paint too, same as before), then hydrates the real cart in
 * place via a Server Action after mount -- same cookie-based read, just
 * moved to an on-demand action call instead of the page's own render
 * path, which doesn't affect that page's static-ness at all.
 *
 * min-h-[11rem] on the conditional block below locks the card's height
 * to fit the populated (up to 3 items) case even while still empty, so
 * the swap from empty -> real cart never grows the card -- a real CLS
 * source before this (the brief's "mini-cart when data arrives" item).
 */
export function HeroCartSummary({ className }: { className?: string }) {
  const t = useTranslations();
  const tProduct = useTranslations("product");
  const locale = useLocale();
  const isAr = locale !== "en";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const [summary, setSummary] = useState<CartSummary>(EMPTY_SUMMARY);

  useEffect(() => {
    let cancelled = false;
    getHeroCartSummaryAction().then((fresh) => {
      if (!cancelled) setSummary(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = summary.items.slice(0, 3);

  return (
    <div className={cn("glass w-full max-w-xs !rounded-[1.75rem] !p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-deep-900">{t("home.yourBoxTitle")}</h3>
        <span className="text-xs font-semibold text-muted-2">
          {t("home.yourBoxItemCount", { count: summary.itemCount })}
        </span>
      </div>

      <div className="min-h-[11rem]">
        {items.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <ShoppingBag className="h-4.5 w-4.5" />
            </span>
            <p className="text-xs text-muted">{t("home.yourBoxEmpty")}</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => {
              const name = pickLocalized(item.products.name_ar, item.products.name_en, locale);
              const image = item.products.product_images.find((img) => img.is_primary) ?? item.products.product_images[0];
              const isKg = item.products.sold_by_weight && item.products.weight_unit === "kg";
              const unit = item.products.sold_by_weight
                ? isKg
                  ? tProduct("kilograms")
                  : tProduct("grams")
                : pickLocalized(item.products.unit_label_ar ?? "", item.products.unit_label_en, locale);
              const displayQuantity = isKg ? Number((item.quantity / 1000).toFixed(2)) : Math.round(item.quantity);
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                    <Image
                      src={image?.url ?? placeholderImage(categoryPlaceholderKey(item.products.categories?.slug), { width: 80, height: 80 })}
                      alt={name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-2">
                      {displayQuantity}
                      {unit ? ` ${unit}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-deep-700">
                    {formatPrice(item.products.price * item.quantity, locale)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-bold text-deep-900">{t("home.yourBoxTotal")}</span>
        <span className="text-base font-extrabold text-deep-900">{formatPrice(summary.subtotal, locale)}</span>
      </div>

      <Link
        href="/cart"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-deep-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-deep-600"
      >
        {t("home.yourBoxCta")}
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
