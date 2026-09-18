import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "dark" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  // Gold pill, matching the FAQ section's "Get started" button -- the
  // site's one primary CTA style, used wherever the main action lives
  // (Add to cart, Checkout, hero CTAs). Rounding lives per-variant (not in
  // the shared base below) since cn() is a plain class-join, not
  // tailwind-merge -- a shared "rounded-xl" plus a later "rounded-full"
  // would leave both classes in the string with an unpredictable winner.
  primary:
    "rounded-full bg-gold-400 text-deep-900 shadow-[0_2px_0_rgba(0,0,0,0.08)] hover:bg-gold-500 hover:-translate-y-0.5 active:translate-y-0 active:bg-gold-500 focus-visible:outline-gold-500",
  secondary:
    "rounded-xl bg-deep-700 text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_10px_24px_-8px_rgba(14,27,20,0.55)] hover:bg-deep-600 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-deep-600",
  outline:
    "rounded-xl border border-border-strong bg-white/70 text-foreground backdrop-blur-sm hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-brand-600",
  ghost:
    "rounded-xl text-foreground hover:bg-brand-50 focus-visible:outline-brand-600",
  dark:
    "rounded-xl glass-dark text-white hover:brightness-110 focus-visible:outline-brand-400",
  danger:
    "rounded-xl bg-danger text-white hover:brightness-105 focus-visible:outline-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-[3.25rem] px-7 text-base",
};

/**
 * Shared styling for anything that should look like a button, including a
 * `Link` acting as a call-to-action -- a `<Link>`/`<a>` should never be
 * nested inside an actual `<button>` element (invalid, nested interactive
 * controls), so link-as-button surfaces apply these classes directly.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "relative inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
