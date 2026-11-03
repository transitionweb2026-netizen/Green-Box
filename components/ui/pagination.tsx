import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Plain <a> pagination (full navigation, no client JS needed) -- used on
 * catalog/search pages where `?page=` is the only changing param. */
export function Pagination({
  page,
  totalPages,
  makeHref,
  rtl = false,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
  rtl?: boolean;
}) {
  if (totalPages <= 1) return null;
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;

  const pages = pageWindow(page, totalPages);

  return (
    // overflow-x-auto is a safety net, not the normal case: pageWindow()
    // shows at most 7 buttons (prev/next + up to 7 page numbers), which
    // fits a phone width at h-9, but if a catalog/search result ever
    // grows past ~168 items the row scrolls horizontally in its own
    // container instead of silently clipping off the right edge.
    <nav className="mt-8 flex items-center justify-center gap-1 overflow-x-auto px-1 sm:gap-1.5" aria-label="Pagination">
      <a
        href={makeHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-white/70 text-foreground transition-colors hover:bg-brand-50 sm:h-10 sm:w-10",
          page === 1 && "pointer-events-none opacity-40",
        )}
      >
        <Prev className="h-4 w-4" />
      </a>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="shrink-0 px-1 text-muted-2">
            …
          </span>
        ) : (
          <a
            key={p}
            href={makeHref(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition-colors sm:h-10 sm:w-10",
              p === page
                ? "bg-brand-gradient border-transparent text-white shadow-[0_6px_16px_-6px_rgba(84,120,41,0.6)]"
                : "border-border-strong bg-white/70 text-foreground hover:bg-brand-50",
            )}
          >
            {p}
          </a>
        ),
      )}
      <a
        href={makeHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-white/70 text-foreground transition-colors hover:bg-brand-50 sm:h-10 sm:w-10",
          page === totalPages && "pointer-events-none opacity-40",
        )}
      >
        <Next className="h-4 w-4" />
      </a>
    </nav>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}
