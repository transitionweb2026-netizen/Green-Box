"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateStoreSettingsAction, type SettingsActionState } from "@/app/admin/(dashboard)/content/actions";
import type { StoreInfo } from "@/lib/services/content";

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
      <div>
        <Label htmlFor="whatsapp_phone">رقم الواتساب</Label>
        <Input id="whatsapp_phone" name="whatsapp_phone" defaultValue={storeInfo?.whatsapp_phone ?? ""} placeholder="مثال: 010XXXXXXXX" />
      </div>
      <div>
        <Label htmlFor="delivery_phone">رقم التوصيل / المكتب</Label>
        <Input id="delivery_phone" name="delivery_phone" defaultValue={storeInfo?.delivery_phone ?? ""} placeholder="مثال: 010XXXXXXXX" />
      </div>

      <div className="border-t border-border/70 pt-4">
        <h3 className="mb-3 text-sm font-bold text-foreground">روابط السوشيال ميديا (اختياري)</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="social_facebook">فيسبوك</Label>
            <Input id="social_facebook" name="social_facebook" type="url" defaultValue={storeInfo?.social_facebook ?? ""} placeholder="https://facebook.com/..." />
          </div>
          <div>
            <Label htmlFor="social_instagram">إنستجرام</Label>
            <Input id="social_instagram" name="social_instagram" type="url" defaultValue={storeInfo?.social_instagram ?? ""} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <Label htmlFor="social_tiktok">تيك توك</Label>
            <Input id="social_tiktok" name="social_tiktok" type="url" defaultValue={storeInfo?.social_tiktok ?? ""} placeholder="https://tiktok.com/@..." />
          </div>
        </div>
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
