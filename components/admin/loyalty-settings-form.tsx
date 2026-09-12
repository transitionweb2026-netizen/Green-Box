"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateLoyaltySettingsAction, type LoyaltySettingsActionState } from "@/app/admin/(dashboard)/loyalty/actions";
import type { LoyaltySettings } from "@/lib/services/loyalty";

export function LoyaltySettingsForm({ settings }: { settings: LoyaltySettings }) {
  const [state, formAction, isPending] = useActionState(
    updateLoyaltySettingsAction,
    { status: "idle" } as LoyaltySettingsActionState,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="is_enabled" defaultChecked={settings.is_enabled} className="h-4 w-4" />
        تفعيل برنامج نقاط الولاء
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="spend_threshold">الإنفاق مقابل النقاط (جنيه)</Label>
          <Input id="spend_threshold" name="spend_threshold" type="number" min="1" defaultValue={settings.spend_threshold} required />
        </div>
        <div>
          <Label htmlFor="points_per_threshold">عدد النقاط المكتسبة</Label>
          <Input
            id="points_per_threshold"
            name="points_per_threshold"
            type="number"
            min="1"
            defaultValue={settings.points_per_threshold}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="redemption_points_unit">عدد النقاط للاستبدال</Label>
          <Input
            id="redemption_points_unit"
            name="redemption_points_unit"
            type="number"
            min="1"
            defaultValue={settings.redemption_points_unit}
            required
          />
        </div>
        <div>
          <Label htmlFor="points_redemption_value">قيمة الاستبدال (جنيه)</Label>
          <Input
            id="points_redemption_value"
            name="points_redemption_value"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.points_redemption_value}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="min_redeemable_points">أقل عدد نقاط يمكن استبداله (اختياري)</Label>
        <Input id="min_redeemable_points" name="min_redeemable_points" type="number" min="0" defaultValue={settings.min_redeemable_points ?? ""} />
      </div>

      <p className="text-sm text-muted">
        مثال: {settings.spend_threshold} جنيه = {settings.points_per_threshold} نقطة، و{settings.redemption_points_unit} نقطة = {settings.points_redemption_value} جنيه.
      </p>

      {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
      </Button>
    </form>
  );
}
