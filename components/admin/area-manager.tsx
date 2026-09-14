"use client";

import { useActionState, useTransition } from "react";
import { MapPin, Plus, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import { addAreaAction, deactivateAreaAction, type AreaActionState } from "@/app/admin/(dashboard)/delivery-zones/actions";
import type { DeliveryArea } from "@/lib/services/delivery";

export function AreaManager({ zoneId, areas }: { zoneId: string; areas: DeliveryArea[] }) {
  const [state, formAction, isPending] = useActionState(addAreaAction.bind(null, zoneId), { status: "idle" } as AreaActionState);
  const [isDeactivating, startTransition] = useTransition();

  return (
    <Card tone="glass">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <MapPin className="h-4 w-4 text-brand-600" /> مناطق التغطية
      </h2>
      {areas.length === 0 ? (
        <p className="text-sm text-muted">لا توجد مناطق تغطية بعد لهذه المنطقة.</p>
      ) : (
        <ul className="space-y-2">
          {areas.map((area) => (
            <li key={area.id} className="flex items-center justify-between rounded-xl border border-border bg-white/60 p-2.5 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                {area.governorate} - {area.city} - {area.area}
                {!area.is_active && <Badge tone="neutral">معطلة</Badge>}
              </span>
              {area.is_active && (
                <button
                  type="button"
                  disabled={isDeactivating}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg"
                  onClick={() => startTransition(() => deactivateAreaAction(zoneId, area.id))}
                >
                  <PowerOff className="h-3.5 w-3.5" /> تعطيل
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
        <Button type="submit" size="sm" disabled={isPending} loading={isPending} className="sm:col-span-3">
          {!isPending && <Plus className="h-4 w-4" />}
          {isPending ? "جارٍ الإضافة..." : "إضافة منطقة تغطية"}
        </Button>
      </form>
      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}
    </Card>
  );
}
