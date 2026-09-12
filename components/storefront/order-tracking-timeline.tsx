import { getTranslations } from "next-intl/server";
import type { OrderStatus } from "@/types/database";

const SEQUENCE: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED"];

export async function OrderTrackingTimeline({ status }: { status: OrderStatus }) {
  const t = await getTranslations("orders.status");

  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{t("CANCELLED")}</div>
    );
  }

  const currentIndex = SEQUENCE.indexOf(status);

  return (
    <ol className="space-y-3">
      {SEQUENCE.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-brand-600 text-white"
                  : current
                    ? "border-2 border-brand-600 text-brand-700"
                    : "border-2 border-border text-muted"
              }`}
              aria-hidden
            >
              {done ? "✓" : current ? "●" : "○"}
            </span>
            <span className={done || current ? "font-medium text-foreground" : "text-muted"}>{t(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}
