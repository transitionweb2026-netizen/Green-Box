"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import { ORDER_STATUS_TONE, toneFor } from "@/lib/ui/status";
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
  const [note, setNote] = useState("");

  if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
    return <Badge tone={toneFor(ORDER_STATUS_TONE, currentStatus)}>{LABELS[currentStatus]}</Badge>;
  }

  const currentIndex = SEQUENCE.indexOf(currentStatus);
  const nextStatus = SEQUENCE[currentIndex + 1];

  function apply(status: OrderStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, status, note.trim() || undefined);
        setNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "حصل خطأ");
      }
    });
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="ملاحظة اختيارية (تظهر في سجل الحالة)"
        className="h-10 w-full max-w-md rounded-xl border border-border bg-white/80 px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
      />
      <div className="flex flex-wrap items-center gap-3">
        {nextStatus && (
          <Button size="sm" disabled={isPending} loading={isPending} onClick={() => apply(nextStatus)}>
            {!isPending && <ArrowLeft className="h-3.5 w-3.5" />}
            {isPending ? "..." : `نقل إلى: ${LABELS[nextStatus]}`}
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => apply("CANCELLED")}>
          <Ban className="h-3.5 w-3.5" />
          إلغاء الطلب
        </Button>
      </div>
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}
