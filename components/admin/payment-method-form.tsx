"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card tone="glass">
      <form action={formAction} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">
            {method.name_ar} <span className="text-muted">({method.code})</span>
          </h2>
          <Badge tone={method.is_active ? "success" : "neutral"}>{method.is_active ? "نشطة" : "معطلة"}</Badge>
        </div>
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
          <Input id={`wallet_${method.id}`} name="wallet_number" defaultValue={walletNumber} placeholder="01xxxxxxxxx" dir="ltr" />
        </div>
        <div>
          <Label htmlFor={`instructions_ar_${method.id}`}>تعليمات الدفع بالعربي</Label>
          <Textarea id={`instructions_ar_${method.id}`} name="instructions_ar" defaultValue={method.instructions_ar ?? ""} rows={2} />
        </div>
        <div>
          <Label htmlFor={`instructions_en_${method.id}`}>تعليمات الدفع بالإنجليزي</Label>
          <Textarea id={`instructions_en_${method.id}`} name="instructions_en" defaultValue={method.instructions_en ?? ""} rows={2} />
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
            <input type="checkbox" name="is_active" defaultChecked={method.is_active} className="h-4 w-4 accent-[var(--brand-600)]" />
            نشطة (متاحة عند الدفع)
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
            <input type="checkbox" name="requires_proof" defaultChecked={method.requires_proof} className="h-4 w-4 accent-[var(--brand-600)]" />
            تتطلب إثبات دفع
          </label>
        </div>

        {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
        {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

        <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
          {!isPending && <Save className="h-3.5 w-3.5" />}
          {isPending ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </form>
    </Card>
  );
}
