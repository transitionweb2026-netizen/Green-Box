"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import type { AddressActionState } from "@/app/[locale]/account/addresses/actions";
import type { Address } from "@/lib/services/addresses";
import type { DeliveryArea, DeliveryZone } from "@/lib/services/delivery";

type AreaWithZone = DeliveryArea & { delivery_zones: DeliveryZone };

export function AddressForm({
  areas,
  address,
  action,
}: {
  areas: AreaWithZone[];
  address?: Address;
  action: (state: AddressActionState, formData: FormData) => Promise<AddressActionState>;
}) {
  const t = useTranslations("addresses");
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as AddressActionState);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="label">{t("labelField")}</Label>
        <Input id="label" name="label" defaultValue={address?.label ?? ""} />
      </div>
      <div>
        <Label htmlFor="recipientName">{t("recipientName")}</Label>
        <Input id="recipientName" name="recipientName" defaultValue={address?.recipient_name} required minLength={2} />
      </div>
      <div>
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={address?.phone} required minLength={8} />
      </div>
      <div>
        <Label htmlFor="deliveryAreaId">{t("area")}</Label>
        {areas.length === 0 ? (
          <p className="text-sm text-muted">{t("noAreasNotice")}</p>
        ) : (
          <select
            id="deliveryAreaId"
            name="deliveryAreaId"
            defaultValue={address?.delivery_area_id ?? ""}
            required
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground"
          >
            <option value="" disabled>
              {t("selectArea")}
            </option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.governorate} - {area.city} - {area.area}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <Label htmlFor="detailedAddress">{t("detailedAddress")}</Label>
        <Input id="detailedAddress" name="detailedAddress" defaultValue={address?.detailed_address} required minLength={3} />
      </div>
      <div>
        <Label htmlFor="landmark">{t("landmark")}</Label>
        <Input id="landmark" name="landmark" defaultValue={address?.landmark ?? ""} />
      </div>
      <div>
        <Label htmlFor="notes">{t("notesLabel")}</Label>
        <Input id="notes" name="notes" defaultValue={address?.notes ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isDefault" defaultChecked={address?.is_default ?? false} className="h-4 w-4" />
        {t("setDefault")}
      </label>

      {state.status === "error" && <FormMessage>{t("save")}: {state.errorCode}</FormMessage>}

      <Button type="submit" disabled={isPending || areas.length === 0}>
        {isPending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
