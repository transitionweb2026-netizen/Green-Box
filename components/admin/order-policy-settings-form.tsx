"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateOrderPolicySettingsAction } from "@/app/admin/(dashboard)/content/actions";
import type { SettingsActionState } from "@/app/admin/(dashboard)/content/actions";

export function OrderPolicySettingsForm({
  cancellationEnabled,
  cutoffHours,
}: {
  cancellationEnabled: boolean;
  cutoffHours: number;
}) {
  const [state, formAction, isPending] = useActionState(updateOrderPolicySettingsAction, {
    status: "idle",
  } as SettingsActionState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <p className="text-sm text-muted">
        السياسة النهائية للإلغاء والاسترجاع لسه محتاجة قرار من إدارة المتجر -- الإعدادات دي بتتحكم في السلوك الحالي فقط
        وممكن تتغيّر في أي وقت.
      </p>
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          name="customer_cancellation_enabled"
          defaultChecked={cancellationEnabled}
          className="h-4 w-4 accent-[var(--brand-600)]"
        />
        السماح للعميل بإلغاء طلبه بنفسه
      </label>
      <div>
        <Label htmlFor="cancellation_cutoff_hours">أقل عدد ساعات قبل ميعاد التوصيل للسماح بالإلغاء</Label>
        <Input
          id="cancellation_cutoff_hours"
          name="cancellation_cutoff_hours"
          type="number"
          min={0}
          max={72}
          defaultValue={cutoffHours}
          className="max-w-[140px]"
        />
      </div>
      {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
      {state.status === "error" && <FormMessage>حصل خطأ أثناء الحفظ. حاول تاني.</FormMessage>}
      <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
        {!isPending && <Save className="h-3.5 w-3.5" />}
        {isPending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
