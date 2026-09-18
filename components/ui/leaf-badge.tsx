import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Small hand-drawn sprig (stem + three leaves, decreasing in size) used to
 * flank the gold title badges sitewide -- colored via `currentColor` so
 * callers set the green with a text-* class.
 */
function LeafSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <path
        d="M8 52 Q 20 36 34 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <g fill="currentColor">
        <path d="M10 46c-6-4-8-11-4-17 7 2 11 9 8 16-1 2-2 2-4 1z" />
        <path d="M20 32c-6-4-7-11-3-17 7 2 10 9 7 16-1 2-2 2-4 1z" />
        <path d="M30 16c-5-4-6-10-2-15 6 2 9 8 6 14-1 2-2 2-4 1z" />
      </g>
      <path
        d="M10 42c2-4 4-7 6-9M20 28c2-4 3-6 5-8M30 13c1-3 2-5 4-7"
        fill="none"
        stroke="var(--background)"
        strokeWidth="1"
        opacity="0.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The site's gold title badge (see the redesign that made every
 * SectionHeader/FAQ title a rotated gold pill), now flanked by a leaf
 * sprig on each side for a more finished, "botanical seal" look instead of
 * the bare badge on its own. Both sprigs mirror off the same SVG so they
 * read as a symmetrical pair rather than two unrelated shapes.
 */
export function LeafBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className="relative inline-flex items-center">
      <LeafSprig className="absolute end-[calc(100%-0.25rem)] bottom-0 h-7 w-7 rotate-[95deg] text-brand-600 sm:h-9 sm:w-9" />
      <span
        className={cn(
          "-rotate-2 inline-block rounded-md bg-gold-400 px-5 py-1.5 font-serif text-xl font-extrabold tracking-tight text-deep-900 shadow-[0_2px_0_rgba(0,0,0,0.08)] sm:text-2xl",
          className,
        )}
      >
        {children}
      </span>
      <LeafSprig className="absolute start-[calc(100%-0.25rem)] bottom-0 h-7 w-7 -rotate-[95deg] scale-x-[-1] text-brand-600 sm:h-9 sm:w-9" />
    </span>
  );
}
