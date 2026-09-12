"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateStoreSettingsAction, type SettingsActionState } from "@/app/admin/(dashboard)/content/actions";

interface StoreInfo {
  store_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export function StoreSettingsForm({ storeInfo }: { storeInfo: StoreInfo | null }) {
  const [state, formAction, isPending] = useActionState(updateStoreSettingsAction, { status: "idle" } as SettingsActionState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="store_name">اسم المتجر</Label>
        <Input id="store_name" name="store_name" defaultValue={storeInfo?.store_name ?? "جرين بوكس"} />
      </div>
      <div>
        <Label htmlFor="contact_phone">رقم التواصل</Label>
        <Input id="contact_phone" name="contact_phone" defaultValue={storeInfo?.contact_phone ?? ""} />
      </div>
      <div>
        <Label htmlFor="contact_email">البريد الإلكتروني للتواصل</Label>
        <Input id="contact_email" name="contact_email" type="email" defaultValue={storeInfo?.contact_email ?? ""} />
      </div>
      {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
