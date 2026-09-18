"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddToCartButton } from "./add-to-cart-button";

// Fixed 0.1 step so weight-based products (sold by the product's own
// unit_label, e.g. "kg") can be ordered as fractional amounts like 1.2 --
// cart_items.quantity is a numeric column precisely for this, the stepper
// was just hardcoded to whole numbers. Rounding through toFixed(1) avoids
// classic floating-point drift (0.1 + 0.2 !== 0.3) from repeated clicks.
const STEP = 0.1;
const round1 = (value: number) => Number(value.toFixed(1));

export function ProductPurchaseForm({
  productId,
  unit,
  disabled,
}: {
  productId: string;
  unit?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const [quantity, setQuantity] = useState(0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-xl border border-border-strong bg-white/70">
        <button
          type="button"
          className="flex h-12 w-11 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
          onClick={() => setQuantity((q) => round1(Math.max(0, q - STEP)))}
          disabled={disabled || quantity <= 0}
          aria-label={tCart("decreaseQuantity")}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="flex w-16 items-baseline justify-center gap-1 text-center font-semibold text-foreground" aria-label={t("quantity")}>
          {quantity.toFixed(1)}
          {unit && <span className="text-xs font-medium text-muted-2">{unit}</span>}
        </span>
        <button
          type="button"
          className="flex h-12 w-11 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
          onClick={() => setQuantity((q) => round1(q + STEP))}
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
  );
}
