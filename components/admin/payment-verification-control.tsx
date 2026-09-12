"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { verifyPaymentAction } from "@/app/admin/(dashboard)/orders/actions";
import type { PaymentAttemptStatus } from "@/types/database";

const LABELS: Record<PaymentAttemptStatus, string> = {
  PENDING: "قيد الانتظار",
  AWAITING_VERIFICATION: "بانتظار المراجعة",
  VERIFIED: "تم التأكيد",
  REJECTED: "مرفوض",
  REFUNDED: "تم الاسترجاع",
};

export function PaymentVerificationControl({
  orderId,
  paymentId,
  status,
}: {
  orderId: string;
  paymentId: string;
  status: PaymentAttemptStatus;
}) {
  const [isPending, startTransition] = useTransition();

  if (status === "VERIFIED" || status === "REJECTED" || status === "REFUNDED") {
    return <p className="text-sm text-muted">حالة الدفعة: {LABELS[status]}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => verifyPaymentAction(orderId, paymentId, "VERIFIED"))}
      >
        تأكيد الدفع
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => verifyPaymentAction(orderId, paymentId, "REJECTED"))}
      >
        رفض الدفع
      </Button>
    </div>
  );
}
