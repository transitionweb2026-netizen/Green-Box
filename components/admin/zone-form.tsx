"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import type { ZoneActionState } from "@/app/admin/(dashboard)/delivery-zones/actions";
import type { DeliveryZone } from "@/lib/services/delivery";

export function ZoneForm({
  zone,
  action,
}: {
  zone?: DeliveryZone;
  action: (state: ZoneActionState, formData: FormData) => Promise<ZoneActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as ZoneActionState);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="name_ar">اسم المنطقة بالعربي</Label>
        <Input id="name_ar" name="name_ar" defaultValue={zone?.name_ar} required />
      </div>
      <div>
        <Label htmlFor="name_en">اسم المنطقة بالإنجليزي</Label>
        <Input id="name_en" name="name_en" defaultValue={zone?.name_en ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="delivery_fee">رسوم التوصيل (جنيه)</Label>
          <Input id="delivery_fee" name="delivery_fee" type="number" step="0.01" min="0" defaultValue={zone?.delivery_fee ?? ""} />
        </div>
        <div>
          <Label htmlFor="min_order_amount">الحد الأدنى للطلب</Label>
          <Input
            id="min_order_amount"
            name="min_order_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={zone?.min_order_amount ?? ""}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="display_order">ترتيب العرض</Label>
        <Input id="display_order" name="display_order" type="number" defaultValue={zone?.display_order ?? 0} />
      </div>
      <div>
        <Label htmlFor="notes">ملاحظات</Label>
        <Input id="notes" name="notes" defaultValue={zone?.notes ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="is_active" defaultChecked={zone?.is_active ?? true} className="h-4 w-4" />
        نشطة
      </label>

      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
