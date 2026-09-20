import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { getCartSummaryForCurrentUser } from "@/lib/services/cart";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { categoryPlaceholderKey, placeholderImage } from "@/lib/media/placeholders";
import { cn } from "@/lib/utils/cn";

/**
 * The homepage hero's floating "Your Box" widget, per the reference design.
 * Always shows the signed-in customer's REAL active cart (items, weights,
 * live prices, total) -- never fabricated sample data. Guests / customers
 * with nothing in their cart yet see an honest empty state pointing at
 * /c instead of invented placeholder items.
 */
export async function HeroCartSummary({ className }: { className?: string }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale !== "en";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const summary = await getCartSummaryForCurrentUser();
  const items = summary.items.slice(0, 3);

  return (
    <div className={cn("glass w-72 !rounded-[1.75rem] !p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-deep-900">{t("home.yourBoxTitle")}</h3>
        <span className="text-xs font-semibold text-muted-2">
          {t("home.yourBoxItemCount", { count: summary.itemCount })}
        </span>
      </div>

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
            const unit = pickLocalized(item.products.unit_label_ar ?? "", item.products.unit_label_en, locale);
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
                    {item.quantity}
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
