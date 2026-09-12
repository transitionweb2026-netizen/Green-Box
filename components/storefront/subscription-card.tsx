"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pickLocalized } from "@/lib/i18n/localized";
import { updateSubscriptionStatusAction } from "@/app/[locale]/account/subscriptions/actions";
import type { SubscriptionWithItems } from "@/lib/services/subscriptions";

export function SubscriptionCard({ subscription }: { subscription: SubscriptionWithItems }) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function setStatus(status: "ACTIVE" | "PAUSED" | "CANCELLED") {
    startTransition(() => updateSubscriptionStatusAction(locale, subscription.id, status));
  }

  return (
    <Card className={isPending ? "opacity-60" : ""}>
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            subscription.status === "ACTIVE"
              ? "bg-brand-100 text-brand-800"
              : subscription.status === "PAUSED"
                ? "bg-amber-100 text-amber-800"
                : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {t(`status.${subscription.status}`)}
        </span>
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
      <h3 className="mt-3 text-sm font-semibold text-foreground">{t("itemsTitle")}</h3>
      <ul className="mt-1 space-y-1 text-sm text-muted">
        {subscription.subscription_items.map((item) => (
          <li key={item.id}>
            {pickLocalized(item.products.name_ar, item.products.name_en, locale)} × {item.quantity}
          </li>
        ))}
      </ul>
    </Card>
  );
}
