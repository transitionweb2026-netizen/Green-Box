"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { updatePaymentMethodAction, type PaymentMethodActionState } from "@/app/admin/(dashboard)/payments/actions";
import type { PaymentMethod } from "@/lib/services/payments";

export function PaymentMethodForm({ method }: { method: PaymentMethod }) {
  const [state, formAction, isPending] = useActionState(
    updatePaymentMethodAction.bind(null, method.id),
    { status: "idle" } as PaymentMethodActionState,
  );
  const walletNumber = (method.account_details as { wallet_number?: string })?.wallet_number ?? "";

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <h2 className="font-semibold text-foreground">{method.name_ar} ({method.code})</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`name_ar_${method.id}`}>الاسم بالعربي</Label>
            <Input id={`name_ar_${method.id}`} name="name_ar" defaultValue={method.name_ar} required />
          </div>
          <div>
            <Label htmlFor={`name_en_${method.id}`}>الاسم بالإنجليزي</Label>
            <Input id={`name_en_${method.id}`} name="name_en" defaultValue={method.name_en ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor={`wallet_${method.id}`}>رقم المحفظة / الحساب</Label>
          <Input id={`wallet_${method.id}`} name="wallet_number" defaultValue={walletNumber} placeholder="01xxxxxxxxx" />
        </div>
        <div>
          <Label htmlFor={`instructions_ar_${method.id}`}>تعليمات الدفع بالعربي</Label>
          <textarea
            id={`instructions_ar_${method.id}`}
            name="instructions_ar"
            defaultValue={method.instructions_ar ?? ""}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <Label htmlFor={`instructions_en_${method.id}`}>تعليمات الدفع بالإنجليزي</Label>
          <textarea
            id={`instructions_en_${method.id}`}
            name="instructions_en"
            defaultValue={method.instructions_en ?? ""}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="is_active" defaultChecked={method.is_active} className="h-4 w-4" />
            نشطة (متاحة عند الدفع)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="requires_proof" defaultChecked={method.requires_proof} className="h-4 w-4" />
            تتطلب إثبات دفع
          </label>
        </div>

        {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
        {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </form>
    </Card>
  );
}
