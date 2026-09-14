import { PackageOpen, MapPinPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCartSummary, getOrCreateActiveCart } from "@/lib/services/cart";
import { listMyAddresses } from "@/lib/services/addresses";
import { listActiveTimeSlots } from "@/lib/services/delivery";
import { listActivePaymentMethods } from "@/lib/services/payments";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubscriptionCreateForm } from "@/components/storefront/subscription-create-form";

export default async function NewSubscriptionPage() {
  const t = await getTranslations("subscriptions");
  const tCart = await getTranslations("cart");
  const tCheckout = await getTranslations("checkout");
  const tAddresses = await getTranslations("addresses");

  const cart = await getOrCreateActiveCart();
  const { items } = await getCartSummary(cart.id);
  const [addresses, slots, paymentMethods] = await Promise.all([
    listMyAddresses(),
    listActiveTimeSlots(),
    listActivePaymentMethods(),
  ]);

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("create")}</h1>
        <EmptyState
          className="mt-6"
          icon={<PackageOpen className="h-7 w-7" />}
          title={t("empty")}
          action={
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              {tCart("continueShopping")}
            </Link>
          }
        />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("create")}</h1>
        <EmptyState
          className="mt-6"
          icon={<MapPinPlus className="h-7 w-7" />}
          title={tCheckout("noAddresses")}
          action={
            <Link href="/account/addresses/new" className={buttonVariants()}>
              {tAddresses("add")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("create")}</h1>
      <div className="mt-6">
        <SubscriptionCreateForm cartItems={items} addresses={addresses} slots={slots} paymentMethods={paymentMethods} />
      </div>
    </div>
  );
}
