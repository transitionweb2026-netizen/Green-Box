"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/i18n/localized";
import { GRAMS_PER_KG } from "@/lib/utils/weight-unit";
import type { WeightUnit } from "@/types/database";
import { AddToCartButton } from "./add-to-cart-button";

// Weight-priced products (product.sold_by_weight, set in the admin product
// form) always step/store in whole grams underneath -- `price` is
// EGP-per-gram regardless of weightUnit, so quantity IS the gram amount
// directly, no unit conversion anywhere outside this display layer. kg
// mode just shows/accepts kilograms and converts at the input boundary.
// Everything else (packaged items sold as whole trays/nets/pieces, not by
// weight) steps by a plain whole unit -- you can't order "1.2 trays".
const GRAM_STEP = 50;
const KG_STEP = 0.25;
const UNIT_STEP = 1;

export function ProductPurchaseForm({
  productId,
  price,
  unit,
  soldByWeight,
  weightUnit = "gram",
  disabled,
}: {
  productId: string;
  price: number;
  unit?: string;
  soldByWeight?: boolean;
  weightUnit?: WeightUnit;
  disabled?: boolean;
}) {
  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const isKg = soldByWeight && weightUnit === "kg";

  // quantity is always the canonical gram amount. kgText is a separate,
  // freely-typed string so a partial decimal ("1.") isn't clobbered by a
  // reformat on every keystroke -- it's only re-synced from quantity when
  // quantity changes via the stepper buttons, not derived from it on
  // every render.
  const [quantity, setQuantityState] = useState(0);
  const [kgText, setKgText] = useState("0");

  function setQuantity(next: number) {
    const clamped = Math.max(0, Math.round(next));
    setQuantityState(clamped);
    setKgText(String(clamped / GRAMS_PER_KG));
  }

  function onKgTextChange(text: string) {
    setKgText(text);
    const parsed = Number(text);
    if (text.trim() !== "" && !Number.isNaN(parsed)) {
      setQuantityState(Math.max(0, Math.round(parsed * GRAMS_PER_KG)));
    }
  }

  const step = soldByWeight ? (isKg ? KG_STEP * GRAMS_PER_KG : GRAM_STEP) : UNIT_STEP;
  const displayUnit = soldByWeight ? (isKg ? t("kilograms") : t("grams")) : unit;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-xl border border-border-strong bg-white/70">
          <button
            type="button"
            className="flex h-12 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
            onClick={() => setQuantity(Math.max(0, quantity - step))}
            disabled={disabled || quantity <= 0}
            aria-label={tCart("decreaseQuantity")}
          >
            <Minus className="h-4 w-4" />
          </button>
          {isKg ? (
            <input
              type="text"
              inputMode="decimal"
              value={kgText}
              onChange={(e) => onKgTextChange(e.target.value)}
              disabled={disabled}
              aria-label={t("quantity")}
              className="w-16 bg-transparent text-center font-semibold text-foreground focus-visible:outline-none"
            />
          ) : (
            <input
              type="number"
              min={0}
              step={soldByWeight ? GRAM_STEP : UNIT_STEP}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              disabled={disabled}
              aria-label={t("quantity")}
              className="w-16 bg-transparent text-center font-semibold text-foreground [appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          )}
          {displayUnit && <span className="pe-2 text-xs font-medium text-muted-2">{displayUnit}</span>}
          <button
            type="button"
            className="flex h-12 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
            onClick={() => setQuantity(quantity + step)}
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
