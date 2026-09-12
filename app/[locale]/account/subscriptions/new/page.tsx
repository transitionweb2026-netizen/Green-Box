import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCartSummary, getOrCreateActiveCart } from "@/lib/services/cart";
import { listMyAddresses } from "@/lib/services/addresses";
import { listActiveTimeSlots } from "@/lib/services/delivery";
import { listActivePaymentMethods } from "@/lib/services/payments";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubscriptionCreateForm } from "@/components/storefront/subscription-create-form";

export default async function NewSubscriptionPage() {
  const t = await getTranslations("subscriptions");

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
        <Card className="mt-6 text-center text-muted">
          {t("empty")}
          <div className="mt-4">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              {t("create")}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("create")}</h1>
        <Card className="mt-6 text-center text-muted">
          <Link href="/account/addresses/new" className={buttonVariants()}>
            {t("create")}
          </Link>
        </Card>
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
