import { formatPrice } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils/cn";

/**
 * Renders a price, and (only when a real compare-at price is supplied) a
 * struck-through previous price plus a discount badge. The products table
 * currently has no compare-at/original price column -- see DATABASE.md --
 * so `compareAt` is unused today; this exists ready for when that column
 * ships, rather than fabricating a discount that has no data behind it.
 */
export function PriceDisplay({
  value,
  compareAt,
  locale,
  size = "md",
  className,
}: {
  value: number;
  compareAt?: number | null;
  locale: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasDiscount = typeof compareAt === "number" && compareAt > value;
  const percentOff = hasDiscount ? Math.round(((compareAt! - value) / compareAt!) * 100) : 0;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-extrabold text-deep-700",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl",
        )}
      >
        {formatPrice(value, locale)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs text-muted-2 line-through">{formatPrice(compareAt!, locale)}</span>
          <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-bold text-danger">
            -{percentOff}%
          </span>
        </>
      )}
    </div>
  );
}
