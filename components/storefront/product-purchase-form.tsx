"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/i18n/localized";
import { GRAMS_PER_KG } from "@/lib/utils/weight-unit";
import type { WeightUnit } from "@/types/database";
import { AddToCartButton } from "./add-to-cart-button";

// Weight-priced products (product.sold_by_weight, set in the admin product
// form) always store/quantify in whole grams underneath -- `price` is
// EGP-per-gram regardless of weightUnit, so quantity IS the gram amount
// directly, no unit conversion anywhere outside this display layer. The
// customer picks from a fixed set of weight presets (1/4kg, 1/2kg, 1, 1.5,
// 2, 3, 4, 5, 10 kg) instead of free-typing an amount -- per the client's
// own request, so every weight order matches how the product is actually
// packed/weighed for delivery. kg-display products show each preset in
// kilograms; gram-display products show the same physical amount converted
// to grams -- the preset list is the same real quantities either way.
// Everything else (packaged items sold as whole trays/nets/pieces, not by
// weight) still steps by a plain whole unit -- you can't order "1.2 trays".
const PRESET_WEIGHTS_KG = [0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 10];
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

  // quantity is always the canonical gram amount.
  const [quantity, setQuantity] = useState(0);

  const presetOptions = soldByWeight
    ? PRESET_WEIGHTS_KG.map((kg) => ({
        grams: Math.round(kg * GRAMS_PER_KG),
        label: isKg ? String(kg) : String(Math.round(kg * GRAMS_PER_KG)),
      }))
    : [];

  function stepPreset(direction: 1 | -1) {
    const currentIndex = presetOptions.findIndex((option) => option.grams === quantity);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0) {
      setQuantity(0);
      return;
    }
    if (nextIndex >= presetOptions.length) return;
    setQuantity(presetOptions[nextIndex].grams);
  }

  const displayUnit = soldByWeight ? (isKg ? t("kilograms") : t("grams")) : unit;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-xl border border-border-strong bg-white/70">
          {soldByWeight ? (
            <>
              <button
                type="button"
                className="flex h-12 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
                onClick={() => stepPreset(-1)}
                disabled={disabled || quantity <= 0}
                aria-label={tCart("decreaseQuantity")}
              >
                <Minus className="h-4 w-4" />
              </button>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={disabled}
                aria-label={t("quantity")}
                className="h-12 min-w-[5.5rem] bg-transparent px-1 text-center font-semibold text-foreground focus-visible:outline-none"
              >
                <option value={0}>{t("selectWeight")}</option>
                {presetOptions.map((option) => (
                  <option key={option.grams} value={option.grams}>
                    {option.label}
                  </option>
                ))}
              </select>
              {displayUnit && <span className="pe-2 text-xs font-medium text-muted-2">{displayUnit}</span>}
              <button
                type="button"
                className="flex h-12 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
                onClick={() => stepPreset(1)}
                disabled={disabled || quantity === presetOptions[presetOptions.length - 1]?.grams}
                aria-label={tCart("increaseQuantity")}
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex h-12 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
                onClick={() => setQuantity(Math.max(0, quantity - UNIT_STEP))}
                disabled={disabled || quantity <= 0}
                aria-label={tCart("decreaseQuantity")}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={0}
                step={UNIT_STEP}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                disabled={disabled}
                aria-label={t("quantity")}
                className="w-16 bg-transparent text-center font-semibold text-foreground [appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {displayUnit && <span className="pe-2 text-xs font-medium text-muted-2">{displayUnit}</span>}
              <button
                type="button"
                className="flex h-12 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
                onClick={() => setQuantity(quantity + UNIT_STEP)}
                disabled={disabled}
                aria-label={tCart("increaseQuantity")}
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
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
