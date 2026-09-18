import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SectionHeader({
  title,
  description,
  action,
  tone = "light",
  as: Heading = "h2",
  className,
}: {
  /** No longer rendered -- every title is now the gold badge below, which
   * already plays the eyebrow's old "small label" role, so a separate pill
   * stacked above it would just duplicate that. Kept in the props so
   * existing call sites don't need to drop it. */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "light" | "dark";
  /** Heading level -- defaults to h2 (a section heading). Pass "h1" when
   * this is the page's own primary title (e.g. a category/listing page
   * with no other h1), so the page keeps exactly one h1. */
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <Heading>
        <span className="-rotate-2 inline-block rounded-md bg-gold-400 px-5 py-1.5 font-serif text-xl font-extrabold tracking-tight text-deep-900 shadow-[0_2px_0_rgba(0,0,0,0.08)] sm:text-2xl">
          {title}
        </span>
      </Heading>
      {description && (
        <p className={cn("max-w-xl text-sm sm:text-base", tone === "dark" ? "text-white/70" : "text-muted")}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
