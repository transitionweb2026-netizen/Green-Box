"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/i18n/localized";
import { AddToCartButton } from "./add-to-cart-button";

// Weight-priced products (product.sold_by_weight, set in the admin product
// form) step in whole grams -- `price` is EGP-per-gram for these, so
// quantity IS the gram amount directly, no unit conversion anywhere.
// Everything else (packaged items sold as whole trays/nets/pieces, not by
// weight) steps by a plain whole unit -- you can't order "1.2 trays".
const GRAM_STEP = 50;
const UNIT_STEP = 1;

export function ProductPurchaseForm({
  productId,
  price,
  unit,
  soldByWeight,
  disabled,
}: {
  productId: string;
  price: number;
  unit?: string;
  soldByWeight?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const [quantity, setQuantity] = useState(0);

  const step = soldByWeight ? GRAM_STEP : UNIT_STEP;
  const round = (value: number) => Math.round(value);
  const displayQuantity = String(quantity);
  const displayUnit = soldByWeight ? t("grams") : unit;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-xl border border-border-strong bg-white/70">
          <button
            type="button"
            className="flex h-12 w-11 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
            onClick={() => setQuantity((q) => round(Math.max(0, q - step)))}
            disabled={disabled || quantity <= 0}
            aria-label={tCart("decreaseQuantity")}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className="flex w-16 items-baseline justify-center gap-1 text-center font-semibold text-foreground"
            aria-label={t("quantity")}
          >
            {displayQuantity}
            {displayUnit && <span className="text-xs font-medium text-muted-2">{displayUnit}</span>}
          </span>
          <button
            type="button"
            className="flex h-12 w-11 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
            onClick={() => setQuantity((q) => round(q + step))}
            disabled={disabled}
            aria-label={tCart("increaseQuantity")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-[10rem] flex-1">
          <AddToCartButton productId={productId} quantity={quantity} disabled={disabled || quantity <= 0} />
        </div>
      </div>

      {soldByWeight && quantity > 0 && (
        <p className="text-sm font-semibold text-deep-700">
          {t("calculatedTotal")}: {formatPrice(price * quantity, locale)}
        </p>
      )}
    </div>
  );
}
