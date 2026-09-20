"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
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
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await addToCartAction(locale, productId, quantity, pathname);
      if (result.status === "success") {
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 1500);
      }
    });
  }

  if (compact) {
    return (
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={handleClick}
        aria-label={t("addToCart")}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
          added
            ? "bg-brand-600 text-white"
            : "bg-deep-800 text-white shadow-[0_6px_16px_-6px_rgba(14,27,20,0.5)] hover:scale-110 active:scale-95",
        )}
      >
        {isPending ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : added ? (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={added ? "secondary" : "box"}
      disabled={disabled || isPending}
      loading={isPending}
      onClick={handleClick}
      aria-label={t("addToCart")}
      className="w-full"
    >
      {!isPending && (added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />)}
      {isPending ? t("adding") : added ? t("added") : t("addToCart")}
    </Button>
  );
}
