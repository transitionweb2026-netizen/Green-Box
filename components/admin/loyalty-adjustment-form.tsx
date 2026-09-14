"use client";

import { useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { adminAdjustLoyaltyPointsAction } from "@/app/admin/(dashboard)/loyalty/[profileId]/actions";

export function LoyaltyAdjustmentForm({ profileId }: { profileId: string }) {
  const [isPending, startTransition] = useTransition();
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  function submit() {
    setMessage(null);
    const parsed = Number(points);
    startTransition(async () => {
      const result = await adminAdjustLoyaltyPointsAction(profileId, parsed, reason);
      if (result.status === "success") {
        setMessage({ variant: "success", text: `تم التعديل. الرصيد الجديد: ${result.newBalance}` });
        setPoints("");
        setReason("");
      } else {
        setMessage({ variant: "error", text: result.message ?? "حصل خطأ" });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          placeholder="النقاط (+/-)"
          className="h-10 rounded-xl border border-border bg-white/80 px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="السبب (مطلوب)"
          className="h-10 rounded-xl border border-border bg-white/80 px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
        />
      </div>
      <Button size="sm" disabled={isPending} loading={isPending} onClick={submit}>
        <PlusCircle className="h-3.5 w-3.5" /> تطبيق التعديل
      </Button>
      {message && <FormMessage variant={message.variant}>{message.text}</FormMessage>}
      <p className="text-xs text-muted-2">استخدم رقمًا سالبًا لخصم نقاط. لا يمكن أن يصبح الرصيد أقل من صفر.</p>
    </div>
  );
}
