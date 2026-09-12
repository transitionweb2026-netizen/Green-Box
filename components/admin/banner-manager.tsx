"use client";

import { useActionState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form-message";
import { createBannerAction, deleteBannerAction, toggleBannerActiveAction, type BannerActionState } from "@/app/admin/(dashboard)/content/actions";
import type { Banner } from "@/lib/services/content";

export function BannerManager({ banners }: { banners: Banner[] }) {
  const [state, formAction, isPending] = useActionState(createBannerAction, { status: "idle" } as BannerActionState);
  const [isToggling, startTransition] = useTransition();

  return (
    <div>
      <h2 className="mb-3 font-semibold text-foreground">بانرات الصفحة الرئيسية</h2>

      <div className="space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
            {banner.image_url && (
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                <Image src={banner.image_url} alt={banner.title_ar ?? ""} fill className="object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{banner.title_ar ?? "بدون عنوان"}</p>
              <p className="text-sm text-muted">{banner.is_active ? "نشط" : "معطل"}</p>
            </div>
            <button
              type="button"
              disabled={isToggling}
              className="text-sm text-brand-700 hover:underline"
              onClick={() => startTransition(() => toggleBannerActiveAction(banner.id, !banner.is_active))}
            >
              {banner.is_active ? "تعطيل" : "تفعيل"}
            </button>
            <button
              type="button"
              disabled={isToggling}
              className="text-sm text-danger hover:underline"
              onClick={() => {
                if (confirm("متأكد من حذف هذا البانر؟")) startTransition(() => deleteBannerAction(banner.id));
              }}
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <form action={formAction} className="mt-4 space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">إضافة بانر جديد</h3>
        <Input name="title_ar" placeholder="العنوان بالعربي" />
        <Input name="title_en" placeholder="العنوان بالإنجليزي" />
        <Input name="link_url" type="url" placeholder="رابط عند الضغط (اختياري)" />
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4" />
          نشط
        </label>
        {state.status === "error" && <FormMessage>{state.message}</FormMessage>}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "جارٍ الإضافة..." : "إضافة البانر"}
        </Button>
      </form>
    </div>
  );
}
