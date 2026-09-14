import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { inputClasses } from "./input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        inputClasses,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2362705f%22><path d=%22M5.5 7.5l4.5 5 4.5-5%22 stroke=%22%2362705f%22 stroke-width=%221.5%22 fill=%22none%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat pe-9 rtl:bg-[left_0.75rem_center]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-white/80 px-3.5 py-2.5 text-base text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] backdrop-blur-sm transition-colors placeholder:text-muted-2 hover:border-border-strong focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
