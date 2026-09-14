import { Plus, RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listMySubscriptions } from "@/lib/services/subscriptions";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubscriptionCard } from "@/components/storefront/subscription-card";

export default async function SubscriptionsPage() {
  const t = await getTranslations("subscriptions");
  const subscriptions = await listMySubscriptions();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        <Link href="/account/subscriptions/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          {t("create")}
        </Link>
      </div>

      <div className="mt-6">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={<RefreshCw className="h-7 w-7" />}
            title={t("empty")}
            action={
              <Link href="/account/subscriptions/new" className={buttonVariants()}>
                {t("create")}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {subscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id} subscription={subscription} linkToDetail />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
