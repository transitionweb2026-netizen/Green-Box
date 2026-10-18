/**
 * Formats a box_items.quantity value for display -- "1.5 كجم" for a
 * sold-by-weight item (quantity IS kilograms directly, see box-
 * contents-editor.tsx's doc comment), "×2" for a plain piece count.
 * Trims trailing zeros (1.50 -> "1.5", 2.00 -> "2") since numeric(10,2)
 * always round-trips with two decimals even when the admin typed a
 * whole number.
 */
export function formatBoxItemQuantity(quantity: number, soldByWeight: boolean, kilogramsLabel: string): string {
  if (!soldByWeight) return `×${quantity}`;
  const trimmed = Number(quantity.toFixed(2)).toString();
  return `${trimmed} ${kilogramsLabel}`;
}
