"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/app/[locale]/cart/actions";

export function AddToCartButton({
  productId,
  disabled,
  compact,
  quantity = 1,
}: {
  productId: string;
  disabled?: boolean;
  compact?: boolean;
  quantity?: number;
}) {
  const t = useTranslations("product");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await addToCartAction(locale, productId, quantity);
      if (result.status === "success") {
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 1500);
      }
    });
  }

  return (
    <Button
      type="button"
      size={compact ? "sm" : "md"}
      variant={added ? "secondary" : "primary"}
      disabled={disabled || isPending}
      onClick={handleClick}
      aria-label={t("addToCart")}
    >
      {isPending ? t("adding") : added ? t("added") : compact ? t("addShort") : t("addToCart")}
    </Button>
  );
}
