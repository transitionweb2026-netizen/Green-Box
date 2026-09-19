import { cn } from "@/lib/utils/cn";

/**
 * Wordmark + leaf mark used across the storefront header/footer, auth
 * pages, and (via a dark-tuned instance) the admin shell -- kept as one
 * component so the brand mark stays identical everywhere.
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
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 21c-4.5 0-8-3.5-8-8 0-6 5-9 8-11 3 2 8 5 8 11 0 4.5-3.5 8-8 8Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M12 21c-4.5 0-8-3.5-8-8 0-6 5-9 8-11 3 2 8 5 8 11 0 4.5-3.5 8-8 8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span
        className={cn(
          "bg-clip-text font-serif text-xl leading-none font-black text-transparent drop-shadow-sm",
          tone === "dark" ? "bg-gradient-to-r from-gold-300 via-white to-gold-300" : "bg-gradient-to-r from-brand-600 via-brand-500 to-deep-700",
        )}
      >
        {siteName}
      </span>
    </span>
  );
}
