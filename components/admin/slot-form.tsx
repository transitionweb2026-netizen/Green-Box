"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import type { SlotActionState } from "@/app/admin/(dashboard)/delivery-slots/actions";
import type { DeliveryTimeSlot } from "@/lib/services/delivery";

export function SlotForm({
  slot,
  action,
}: {
  slot?: DeliveryTimeSlot;
  action: (state: SlotActionState, formData: FormData) => Promise<SlotActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as SlotActionState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="label_ar">الاسم بالعربي</Label>
        <Input id="label_ar" name="label_ar" defaultValue={slot?.label_ar} required placeholder="مثال: 9 ص - 12 ظ" />
      </div>
      <div>
        <Label htmlFor="label_en">الاسم بالإنجليزي</Label>
        <Input id="label_en" name="label_en" defaultValue={slot?.label_en ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_time">وقت البداية</Label>
          <Input id="start_time" name="start_time" type="time" defaultValue={slot?.start_time?.slice(0, 5)} required />
        </div>
        <div>
          <Label htmlFor="end_time">وقت النهاية</Label>
          <Input id="end_time" name="end_time" type="time" defaultValue={slot?.end_time?.slice(0, 5)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="display_order">ترتيب العرض</Label>
        <Input id="display_order" name="display_order" type="number" defaultValue={slot?.display_order ?? 0} />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="is_active" defaultChecked={slot?.is_active ?? true} className="h-4 w-4" />
        نشط
      </label>

      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
