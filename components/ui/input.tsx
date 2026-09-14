import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const inputClasses =
  "h-11 w-full rounded-xl border border-border bg-white/80 px-3.5 text-base text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] backdrop-blur-sm transition-colors placeholder:text-muted-2 hover:border-border-strong focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300 disabled:opacity-50";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClasses, className)} {...props} />
));
Input.displayName = "Input";
