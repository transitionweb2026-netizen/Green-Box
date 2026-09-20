import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "brand" | "deep" | "gold" | "danger" | "warning" | "info" | "success" | "neutral" | "surface";

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-200",
  surface: "bg-white text-deep-800 shadow-[0_4px_10px_-4px_rgba(14,27,20,0.25)]",
  deep: "bg-deep-700 text-white",
  gold: "bg-gold-400/20 text-[#8a6a1f] ring-1 ring-inset ring-gold-400/40",
  danger: "bg-danger-bg text-danger ring-1 ring-inset ring-danger/15",
  warning: "bg-warning-bg text-warning ring-1 ring-inset ring-warning/20",
  info: "bg-info-bg text-info ring-1 ring-inset ring-info/20",
  success: "bg-success-bg text-success ring-1 ring-inset ring-success/20",
  neutral: "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "brand", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
