import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class name fragments AND resolves conflicting Tailwind utilities
 * (keeps only the last one in each conflicting group, e.g. `text-brand-800
 * text-brand-300` -> `text-brand-300`) -- the plain clsx-only join this
 * used to be could silently leave BOTH conflicting classes on the element
 * when a component's base tone classes and its caller's override className
 * touched the same property (color, background, ring...), and which one
 * actually won then depended on Tailwind's own internal CSS generation
 * order, not on which one appears later in the className string the way
 * every call site here assumes. That's exactly what made Badge's
 * `tone="brand"` eyebrow pill (bg-brand-100 text-brand-800 ring-brand-200)
 * render with invisible text wherever a caller tried to override it for a
 * dark background (bg-white/10 text-brand-300 ring-brand-300/30, see
 * app/[locale]/page.tsx and app/[locale]/box/page.tsx): text-brand-800 (a
 * near-black green) kept winning over the override's text-brand-300 even
 * though the override comes later in the JSX.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(...classes));
}
