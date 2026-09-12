import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getCartSummary, getOrCreateActiveCart } from "@/lib/services/cart";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartItemRow } from "@/components/storefront/cart-item-row";

export default async function CartPage() {
  const locale = await getLocale();
  await requireAuth(locale, `/${locale}/cart`);
  const t = await getTranslations("cart");

  const cart = await getOrCreateActiveCart();
  const { items, subtotal } = await getCartSummary(cart.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

      {items.length === 0 ? (
        <Card className="mt-6 text-center">
          <p className="text-muted">{t("empty")}</p>
          <Link href="/" className={`${buttonVariants()} mt-4 inline-flex`}>
            {t("emptyCta")}
          </Link>
        </Card>
      ) : (
        <>
          <Card className="mt-6">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </Card>

          <div className="mt-6 flex items-center justify-between text-lg font-semibold text-foreground">
            <span>{t("subtotal")}</span>
            <span>{formatPrice(subtotal, locale)}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              {t("continueShopping")}
            </Link>
            <Link href="/checkout" className={buttonVariants()}>
              {t("checkout")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
