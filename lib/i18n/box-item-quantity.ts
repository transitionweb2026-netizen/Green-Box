import type { BoxItemQuantityUnit } from "@/types/database";

/**
 * Formats a box_items.quantity value for display -- "1.5 كجم"/"250 جم"
 * for a weight-based item (quantity IS the amount in that unit directly,
 * see box-contents-editor.tsx's doc comment), "×2" for a plain piece
 * count. Trims trailing zeros (1.50 -> "1.5", 2.00 -> "2") since
 * numeric(10,2) always round-trips with two decimals even when the
 * admin typed a whole number.
 */
export function formatBoxItemQuantity(
  quantity: number,
  unit: BoxItemQuantityUnit,
  unitLabels: { gram: string; kilogram: string },
): string {
  if (unit === "piece") return `×${quantity}`;
  const trimmed = Number(quantity.toFixed(2)).toString();
  return `${trimmed} ${unit === "gram" ? unitLabels.gram : unitLabels.kilogram}`;
}
