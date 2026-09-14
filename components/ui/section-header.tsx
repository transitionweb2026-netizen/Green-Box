import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  tone = "light",
  as: Heading = "h2",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  tone?: "light" | "dark";
  /** Heading level -- defaults to h2 (a section heading). Pass "h1" when
   * this is the page's own primary title (e.g. a category/listing page
   * with no other h1), so the page keeps exactly one h1. */
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        {eyebrow && (
          <span
            className={cn(
              "mb-2 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase",
              tone === "dark" ? "bg-white/10 text-brand-300" : "bg-brand-100 text-brand-700",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {eyebrow}
          </span>
        )}
        <Heading
          className={cn(
            "text-2xl font-extrabold tracking-tight sm:text-3xl",
            tone === "dark" ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className={cn("mt-2 max-w-xl text-sm sm:text-base", tone === "dark" ? "text-white/70" : "text-muted")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
