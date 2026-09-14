"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { reorderAction } from "@/app/[locale]/account/orders/actions";

export function ReorderButton({ orderId }: { orderId: string }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const Arrow = locale === "ar" ? ChevronLeft : ChevronRight;
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await reorderAction(locale, orderId);
      if (result.status !== "success") {
        setMessage({ variant: "error", text: t("reorderNone") });
        return;
      }
      if (!result.addedCount) {
        setMessage({ variant: "error", text: t("reorderNone") });
        return;
      }
      const parts = [t("reorderSuccess", { count: result.addedCount })];
      if (result.unavailableItems && result.unavailableItems.length > 0) {
        parts.push(t("reorderUnavailable", { items: result.unavailableItems.join("، ") }));
      }
      setMessage({ variant: "success", text: parts.join(" ") });
    });
  }

  return (
    <div>
      <Button size="sm" variant="outline" disabled={isPending} loading={isPending} onClick={handleClick}>
        {!isPending && <RefreshCw className="h-3.5 w-3.5" />}
        {isPending ? t("reordering") : t("reorder")}
      </Button>
      {message && (
        <div className="mt-2">
          <FormMessage variant={message.variant}>{message.text}</FormMessage>
          {message.variant === "success" && (
            <Link
              href="/cart"
              className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              {t("reorderViewCart")}
              <Arrow className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
