import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { LeafBadge } from "./leaf-badge";

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
        <LeafBadge>{title}</LeafBadge>
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
