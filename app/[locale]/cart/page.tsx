import { ShoppingBag, ShoppingCart } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getCartSummary, getOrCreateActiveCart } from "@/lib/services/cart";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CartItemRow } from "@/components/storefront/cart-item-row";

export async function generateMetadata() {
  const t = await getTranslations("cart");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CartPage() {
  const locale = await getLocale();
  await requireAuth(locale, `/${locale}/cart`);
  const t = await getTranslations("cart");

  const cart = await getOrCreateActiveCart();
  const { items, subtotal } = await getCartSummary(cart.id);
  const hasUnavailableItems = items.some((item) => !item.products.is_available);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <ShoppingCart className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{t("title")}</h1>
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<ShoppingBag className="h-7 w-7" />}
          title={t("empty")}
          action={
            <Link href="/" className={buttonVariants()}>
              {t("emptyCta")}
            </Link>
          }
        />
      ) : (
        <>
          {hasUnavailableItems && (
            <p className="mt-6 rounded-xl bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{t("unavailableNotice")}</p>
          )}
          <Card tone="glass" className="mt-8">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </Card>

          <Card tone="glass" className="mt-6">
            <div className="flex items-center justify-between text-lg font-bold text-foreground">
              <span>{t("subtotal")}</span>
              <span className="text-deep-700">{formatPrice(subtotal, locale)}</span>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                {t("continueShopping")}
              </Link>
              <Link href="/checkout" className={buttonVariants({ size: "lg" })}>
                {t("checkout")}
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
