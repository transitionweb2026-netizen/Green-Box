import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function FormMessage({
  children,
  variant = "error",
  className,
}: {
  children?: ReactNode;
  variant?: "error" | "success";
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "mt-1.5 text-sm",
        variant === "error" ? "text-danger" : "text-brand-700",
        className,
      )}
    >
      {children}
    </p>
  );
}
