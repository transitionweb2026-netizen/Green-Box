import { PackageOpen } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getCartSummary, getOrCreateActiveCart } from "@/lib/services/cart";
import { listMyAddresses } from "@/lib/services/addresses";
import { listActiveTimeSlots } from "@/lib/services/delivery";
import { listActivePaymentMethods } from "@/lib/services/payments";
import { getLoyaltySettings, getMyLoyaltyAccount } from "@/lib/services/loyalty";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { CheckoutForm } from "@/components/storefront/checkout-form";

export async function generateMetadata() {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CheckoutPage() {
  const locale = await getLocale();
  await requireAuth(locale, `/${locale}/checkout`);
  const t = await getTranslations("checkout");
  const tCart = await getTranslations("cart");

  const cart = await getOrCreateActiveCart();
  const { items, subtotal } = await getCartSummary(cart.id);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={<PackageOpen className="h-7 w-7" />}
          title={t("cartEmpty")}
          action={
            <Link href="/" className={buttonVariants()}>
              {tCart("continueShopping")}
            </Link>
          }
        />
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
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={<PackageOpen className="h-7 w-7" />}
          title={t("noAddresses")}
          action={
            <Link href="/account/addresses/new" className={buttonVariants()}>
              {t("addAddress")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{t("title")}</h1>
      <div className="mt-8">
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
