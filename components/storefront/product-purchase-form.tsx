"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductPurchaseForm({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-xl border border-border-strong bg-white/70">
        <button
          type="button"
          className="flex h-12 w-11 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={disabled || quantity <= 1}
          aria-label={tCart("decreaseQuantity")}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center font-semibold text-foreground" aria-label={t("quantity")}>
          {quantity}
        </span>
        <button
          type="button"
          className="flex h-12 w-11 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
          onClick={() => setQuantity((q) => q + 1)}
          disabled={disabled}
          aria-label={tCart("increaseQuantity")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="min-w-[10rem] flex-1">
        <AddToCartButton productId={productId} quantity={quantity} disabled={disabled} />
      </div>
    </div>
  );
}
