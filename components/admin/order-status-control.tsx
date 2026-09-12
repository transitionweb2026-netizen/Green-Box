"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { updateOrderStatusAction } from "@/app/admin/(dashboard)/orders/actions";
import type { OrderStatus } from "@/types/database";

const LABELS: Record<OrderStatus, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PREPARING: "جارٍ التحضير",
  PACKING: "جارٍ التغليف",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

const SEQUENCE: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED"];

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
    return <p className="text-sm text-muted">الطلب في حالة نهائية ({LABELS[currentStatus]}).</p>;
  }

  const currentIndex = SEQUENCE.indexOf(currentStatus);
  const nextStatus = SEQUENCE[currentIndex + 1];

  function apply(status: OrderStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حصل خطأ");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {nextStatus && (
        <Button size="sm" disabled={isPending} onClick={() => apply(nextStatus)}>
          {isPending ? "..." : `نقل إلى: ${LABELS[nextStatus]}`}
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => apply("CANCELLED")}>
        إلغاء الطلب
      </Button>
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}
