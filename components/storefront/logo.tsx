import { Leaf, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Wordmark + box mark used across the storefront header/footer, auth
 * pages, and (via a dark-tuned instance) the admin shell -- kept as one
 * component so the brand mark stays identical everywhere. The mark is a
 * literal box (not a leaf) since the brand name is "Green Box" -- the
 * small leaf above the wordmark is a decorative accent alongside it, not
 * a replacement for the box mark.
 */
export function Logo({
  siteName,
  tone = "light",
  className,
}: {
  siteName: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_6px_16px_-6px_rgba(84,120,41,0.7)]",
        )}
        aria-hidden="true"
      >
        <Package className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="relative inline-block">
        <Leaf
          className={cn("absolute -top-2 start-1 h-3 w-3 rotate-[-18deg]", tone === "dark" ? "text-gold-300" : "text-brand-500")}
          aria-hidden="true"
          strokeWidth={2.5}
        />
        <span
          className={cn(
            "bg-clip-text font-serif text-xl leading-none font-black text-transparent drop-shadow-sm",
            tone === "dark" ? "bg-gradient-to-r from-gold-300 via-white to-gold-300" : "bg-gradient-to-r from-brand-600 via-brand-500 to-deep-700",
          )}
        >
          {siteName}
        </span>
      </span>
    </span>
  );
}
