import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `glass` (default) is the liquid-glass 3D surface; `flat` is a plain
   * bordered surface for dense areas (data tables, inline rows) where the
   * glass blur would hurt readability; `dark` is the glass-dark variant
   * for use over deep-green/hero backgrounds. */
  tone?: "glass" | "flat" | "dark";
  hover?: boolean;
}

export function Card({ className, tone = "glass", hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        tone === "glass" && "glass p-6",
        tone === "dark" && "glass-dark p-6",
        tone === "flat" &&
          "rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),var(--shadow-soft)]",
        hover && "glass-hover",
        className,
      )}
      {...props}
    />
  );
}
