"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pickLocalized } from "@/lib/i18n/localized";
import { SUBSCRIPTION_STATUS_TONE, toneFor } from "@/lib/ui/status";
import { cn } from "@/lib/utils/cn";
import { updateSubscriptionStatusAction } from "@/app/[locale]/account/subscriptions/actions";
import type { SubscriptionWithItems } from "@/lib/services/subscriptions";

export function SubscriptionCard({
  subscription,
  linkToDetail = false,
}: {
  subscription: SubscriptionWithItems;
  linkToDetail?: boolean;
}) {
  const t = useTranslations("subscriptions");
  const tOrders = useTranslations("orders");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function setStatus(status: "ACTIVE" | "PAUSED" | "CANCELLED") {
    startTransition(() => updateSubscriptionStatusAction(locale, subscription.id, status));
  }

  return (
    <Card className={cn(isPending && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-deep-700 text-white">
            <RefreshCw className="h-4 w-4" />
          </span>
          <Badge tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)}>{t(`status.${subscription.status}`)}</Badge>
        </div>
        <div className="flex gap-2">
          {subscription.status === "ACTIVE" && (
            <Button size="sm" variant="outline" onClick={() => setStatus("PAUSED")} disabled={isPending}>
              {t("pause")}
            </Button>
          )}
          {subscription.status === "PAUSED" && (
            <Button size="sm" variant="outline" onClick={() => setStatus("ACTIVE")} disabled={isPending}>
              {t("resume")}
            </Button>
          )}
          {subscription.status !== "CANCELLED" && (
            <Button size="sm" variant="ghost" onClick={() => setStatus("CANCELLED")} disabled={isPending}>
              {t("cancel")}
            </Button>
          )}
        </div>
      </div>
      <h3 className="mt-4 text-sm font-bold text-foreground">{t("itemsTitle")}</h3>
      <ul className="mt-2 space-y-1.5">
        {subscription.subscription_items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-1.5 text-sm text-foreground">
            <span>{pickLocalized(item.products.name_ar, item.products.name_en, locale)}</span>
            <Badge tone="brand">×{item.quantity}</Badge>
          </li>
        ))}
      </ul>
      {linkToDetail && (
        <Link
          href={`/account/subscriptions/${subscription.id}`}
          className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
        >
          {tOrders("viewDetails")}
        </Link>
      )}
    </Card>
  );
}
