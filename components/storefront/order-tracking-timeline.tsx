import { Check, Clock, PackageCheck, PackageOpen, ShoppingBag, Truck, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { OrderStatus } from "@/types/database";

const SEQUENCE: { status: OrderStatus; icon: typeof Clock }[] = [
  { status: "PENDING", icon: Clock },
  { status: "CONFIRMED", icon: ShoppingBag },
  { status: "PREPARING", icon: PackageOpen },
  { status: "PACKING", icon: PackageCheck },
  { status: "OUT_FOR_DELIVERY", icon: Truck },
  { status: "DELIVERED", icon: Check },
];

export async function OrderTrackingTimeline({ status }: { status: OrderStatus }) {
  const t = await getTranslations("orders.status");

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-danger-bg px-4 py-3 text-sm font-semibold text-danger">
        <XCircle className="h-5 w-5" />
        {t("CANCELLED")}
      </div>
    );
  }

  const currentIndex = SEQUENCE.findIndex((s) => s.status === status);
  const progressPercent = (currentIndex / (SEQUENCE.length - 1)) * 100;

  return (
    <div>
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:block">
        <div className="relative">
          <div className="absolute top-5 h-1 w-full rounded-full bg-border" />
          <div
            className="bg-brand-gradient absolute top-5 h-1 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
          <ol className="relative grid grid-cols-6">
            {SEQUENCE.map((step, index) => {
              const done = index < currentIndex;
              const current = index === currentIndex;
              return (
                <li key={step.status} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={
                      done || current
                        ? "bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_6px_16px_-6px_rgba(84,120,41,0.6)]"
                        : "flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-surface text-muted-2"
                    }
                  >
                    <step.icon className="h-4 w-4" />
                  </span>
                  <span className={`text-xs font-medium ${done || current ? "text-foreground" : "text-muted-2"}`}>
                    {t(step.status)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Mobile: vertical stepper */}
      <ol className="space-y-4 sm:hidden">
        {SEQUENCE.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li key={step.status} className="flex items-center gap-3">
              <span
                className={
                  done || current
                    ? "bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-2"
                }
              >
                <step.icon className="h-4 w-4" />
              </span>
              <span className={done || current ? "font-semibold text-foreground" : "text-muted-2"}>{t(step.status)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
