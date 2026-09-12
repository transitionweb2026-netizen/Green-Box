import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getCartSummary, getOrCreateActiveCart } from "@/lib/services/cart";
import { listMyAddresses } from "@/lib/services/addresses";
import { listActiveTimeSlots } from "@/lib/services/delivery";
import { listActivePaymentMethods } from "@/lib/services/payments";
import { getLoyaltySettings, getMyLoyaltyAccount } from "@/lib/services/loyalty";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CheckoutForm } from "@/components/storefront/checkout-form";

export default async function CheckoutPage() {
  const locale = await getLocale();
  await requireAuth(locale, `/${locale}/checkout`);
  const t = await getTranslations("checkout");

  const cart = await getOrCreateActiveCart();
  const { items, subtotal } = await getCartSummary(cart.id);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <p className="text-muted">{t("cartEmpty")}</p>
          <Link href="/" className={`${buttonVariants()} mt-4 inline-flex`}>
            {t("addAddress")}
          </Link>
        </Card>
      </div>
    );
  }

  const [addresses, slots, paymentMethods, loyaltySettings, loyaltyAccount] = await Promise.all([
    listMyAddresses(),
    listActiveTimeSlots(),
    listActivePaymentMethods(),
    getLoyaltySettings(),
    getMyLoyaltyAccount(),
  ]);

  if (addresses.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <p className="text-muted">{t("noAddresses")}</p>
          <Link href="/account/addresses/new" className={`${buttonVariants()} mt-4 inline-flex`}>
            {t("addAddress")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <div className="mt-6">
        <CheckoutForm
          addresses={addresses}
          slots={slots}
          paymentMethods={paymentMethods}
          loyaltyAccount={loyaltyAccount}
          loyaltySettings={loyaltySettings}
          subtotal={subtotal}
        />
      </div>
    </div>
  );
}
