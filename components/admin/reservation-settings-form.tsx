"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateReservationSettingsAction } from "@/app/admin/(dashboard)/content/actions";
import type { SettingsActionState } from "@/app/admin/(dashboard)/content/actions";

export function ReservationSettingsForm({ leadDays }: { leadDays: number }) {
  const [state, formAction, isPending] = useActionState(updateReservationSettingsAction, {
    status: "idle",
  } as SettingsActionState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <p className="text-sm text-muted">
        المنتجات اللي عليها علامة &quot;يتطلب حجز مسبق&quot; (زي بعض أصناف الفراخ) محتاجة أقل عدد أيام قبل التوصيل. العميل مش
        هيقدر يطلبها لتوصيل أقرب من كده.
      </p>
      <div>
        <Label htmlFor="lead_days">الحد الأدنى لعدد أيام الحجز المسبق</Label>
        <Input id="lead_days" name="lead_days" type="number" min={0} max={30} defaultValue={leadDays} className="max-w-[140px]" />
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
