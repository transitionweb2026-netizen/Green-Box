import type { WeightUnit } from "@/types/database";

export const GRAMS_PER_KG = 1000;

/** `products.price` is always stored as EGP-per-gram for sold-by-weight
 * items (see supabase/migrations/0031_sold_by_weight.sql) regardless of
 * which unit the admin/customer sees -- weight_unit is a pure display/
 * input-granularity preference. This is the one conversion factor every
 * UI boundary (admin price field, storefront quantity input, per-unit
 * price labels) uses to translate between the stored per-gram value and
 * the chosen display unit, so cart/order math never needs to know it
 * exists. */
export function weightUnitMultiplier(weightUnit: WeightUnit): number {
  return weightUnit === "kg" ? GRAMS_PER_KG : 1;
}

/** The price shown to admins/customers as "per unit" for a sold-by-weight
 * product -- product.price converted from EGP-per-gram to EGP-per-
 * weight_unit. Returns product.price unchanged for non-weight products. */
export function displayUnitPrice(product: { price: number; sold_by_weight: boolean; weight_unit: WeightUnit }): number {
  if (!product.sold_by_weight) return product.price;
  return product.price * weightUnitMultiplier(product.weight_unit);
}
