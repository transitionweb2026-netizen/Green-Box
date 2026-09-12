"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductPurchaseForm({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const t = useTranslations("product");
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-lg text-foreground disabled:opacity-40"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={disabled || quantity <= 1}
          aria-label="-"
        >
          −
        </button>
        <span className="w-10 text-center" aria-label={t("quantity")}>
          {quantity}
        </span>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-lg text-foreground disabled:opacity-40"
          onClick={() => setQuantity((q) => q + 1)}
          disabled={disabled}
          aria-label="+"
        >
          +
        </button>
      </div>
      <AddToCartButton productId={productId} quantity={quantity} disabled={disabled} />
    </div>
  );
}
