import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listMySubscriptions } from "@/lib/services/subscriptions";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubscriptionCard } from "@/components/storefront/subscription-card";

export default async function SubscriptionsPage() {
  const t = await getTranslations("subscriptions");
  const subscriptions = await listMySubscriptions();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        <Link href="/account/subscriptions/new" className={buttonVariants({ size: "sm" })}>
          {t("create")}
        </Link>
      </div>

      <div className="mt-6">
        {subscriptions.length === 0 ? (
          <Card className="text-center text-muted">{t("empty")}</Card>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id} subscription={subscription} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
