"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import { PAYMENT_STATUS_TONE, toneFor } from "@/lib/ui/status";
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
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status === "VERIFIED" || status === "REJECTED" || status === "REFUNDED") {
    return <Badge tone={toneFor(PAYMENT_STATUS_TONE, status)}>{LABELS[status]}</Badge>;
  }

  function apply(newStatus: PaymentAttemptStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await verifyPaymentAction(orderId, paymentId, newStatus, notes.trim() || undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حصل خطأ");
      }
    });
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="ملاحظة اختيارية عن الدفع"
        className="h-10 w-full max-w-md rounded-xl border border-border bg-white/80 px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={isPending} onClick={() => apply("VERIFIED")}>
          <Check className="h-3.5 w-3.5" />
          تأكيد الدفع
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => apply("REJECTED")}>
          <X className="h-3.5 w-3.5" />
          رفض الدفع
        </Button>
      </div>
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}
