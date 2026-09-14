import { type ElementType } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  icon?: ElementType;
  tone?: "brand" | "deep" | "warning" | "danger";
}) {
  return (
    <Card hover className="!p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              tone === "brand" && "bg-brand-100 text-brand-700",
              tone === "deep" && "bg-deep-100 text-deep-700",
              tone === "warning" && "bg-warning-bg text-warning",
              tone === "danger" && "bg-danger-bg text-danger",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-foreground">{value}</p>
    </Card>
  );
}
