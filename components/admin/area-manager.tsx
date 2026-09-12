"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form-message";
import { addAreaAction, deactivateAreaAction, type AreaActionState } from "@/app/admin/(dashboard)/delivery-zones/actions";
import type { DeliveryArea } from "@/lib/services/delivery";

export function AreaManager({ zoneId, areas }: { zoneId: string; areas: DeliveryArea[] }) {
  const [state, formAction, isPending] = useActionState(addAreaAction.bind(null, zoneId), { status: "idle" } as AreaActionState);
  const [isDeactivating, startTransition] = useTransition();

  return (
    <div>
      <h2 className="mb-3 font-semibold text-foreground">مناطق التغطية</h2>
      {areas.length === 0 ? (
        <p className="text-sm text-muted">لا توجد مناطق تغطية بعد لهذه المنطقة.</p>
      ) : (
        <ul className="space-y-2">
          {areas.map((area) => (
            <li key={area.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
              <span>
                {area.governorate} - {area.city} - {area.area}
                {!area.is_active && <span className="ms-2 text-muted">(معطلة)</span>}
              </span>
              {area.is_active && (
                <button
                  type="button"
                  disabled={isDeactivating}
                  className="text-danger hover:underline"
                  onClick={() => startTransition(() => deactivateAreaAction(zoneId, area.id))}
                >
                  تعطيل
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-4 grid gap-2 sm:grid-cols-3">
        <Input name="governorate" placeholder="المحافظة" required />
        <Input name="city" placeholder="المدينة" required />
        <Input name="area" placeholder="المنطقة" required />
        <Button type="submit" size="sm" disabled={isPending} className="sm:col-span-3">
          {isPending ? "جارٍ الإضافة..." : "إضافة منطقة تغطية"}
        </Button>
      </form>
      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}
    </div>
  );
}
