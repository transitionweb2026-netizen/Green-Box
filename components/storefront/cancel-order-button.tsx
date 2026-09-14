"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { cancelOrderAction } from "@/app/[locale]/account/orders/actions";

export function CancelOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    if (!confirm(t("confirmCancel"))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await cancelOrderAction(locale, orderNumber, orderId);
      if (result.status === "success") {
        setMessage({ variant: "success", text: t("cancelSuccess") });
      } else {
        setMessage({ variant: "error", text: t(`cancelErrors.${result.message ?? "GENERIC"}`) });
      }
    });
  }

  if (message?.variant === "success") {
    return <FormMessage variant="success">{message.text}</FormMessage>;
  }

  return (
    <div>
      <Button size="sm" variant="outline" disabled={isPending} loading={isPending} onClick={handleClick}>
        {!isPending && <Ban className="h-3.5 w-3.5" />}
        {isPending ? t("cancelling") : t("cancelOrder")}
      </Button>
      {message && <FormMessage>{message.text}</FormMessage>}
    </div>
  );
}
