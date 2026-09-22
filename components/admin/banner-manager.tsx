"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { AppImage as Image } from "@/components/ui/app-image";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import {
  createBannerAction,
  deleteBannerAction,
  toggleBannerActiveAction,
  updateBannerImagesAction,
  type BannerActionState,
} from "@/app/admin/(dashboard)/content/actions";
import type { Banner } from "@/lib/services/content";

function BannerImageSlot({ bannerId, kind, url }: { bannerId: string; kind: "image" | "image_mobile"; url: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const label = kind === "image" ? "ديسكتوب" : "موبايل";

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateBannerImagesAction(bannerId, formData);
          if (result.status === "error") setError(result.message ?? "فشل رفع الصورة");
        });
      }}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-50">
        {url ? (
          <Image src={url} alt={label} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-2">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-1 text-[0.7rem] font-semibold text-deep-700 hover:text-deep-800">
        <Upload className="h-3 w-3" />
        {isPending ? "جارٍ الرفع..." : `${label} ${url ? "-- تغيير" : ""}`}
        <input
          type="file"
          name={kind}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isPending}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      <FormMessage className="max-w-[6rem] text-center text-[0.65rem]">{error}</FormMessage>
    </form>
  );
}

export function BannerManager({ banners }: { banners: Banner[] }) {
  const [state, formAction, isPending] = useActionState(createBannerAction, { status: "idle" } as BannerActionState);
  const [isToggling, startTransition] = useTransition();

  return (
    <div>
      <h2 className="mb-4 font-bold text-foreground">بانرات الصفحة الرئيسية (صورة الهيرو)</h2>

      <div className="space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white/60 p-3">
            <BannerImageSlot bannerId={banner.id} kind="image" url={banner.image_url} />
            <BannerImageSlot bannerId={banner.id} kind="image_mobile" url={banner.image_url_mobile} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{banner.title_ar ?? "بدون عنوان"}</p>
              <Badge tone={banner.is_active ? "success" : "neutral"} className="mt-1">
                {banner.is_active ? "نشط" : "معطل"}
              </Badge>
            </div>
            <button
              type="button"
              disabled={isToggling}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-deep-700 hover:bg-brand-50"
              onClick={() => startTransition(() => toggleBannerActiveAction(banner.id, !banner.is_active))}
            >
              {banner.is_active ? "تعطيل" : "تفعيل"}
            </button>
            <button
              type="button"
              disabled={isToggling}
              aria-label="حذف"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger-bg"
              onClick={() => {
                if (confirm("متأكد من حذف هذا البانر؟")) startTransition(() => deleteBannerAction(banner.id));
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <form action={formAction} className="mt-4 space-y-3 rounded-xl border border-dashed border-border-strong p-4">
        <h3 className="text-sm font-bold text-foreground">إضافة بانر جديد</h3>
        <Input name="title_ar" placeholder="العنوان بالعربي" />
        <Input name="title_en" placeholder="العنوان بالإنجليزي" />
        <Input name="link_url" type="url" placeholder="رابط عند الضغط (اختياري)" />
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">صورة الهيرو -- ديسكتوب</label>
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">صورة الهيرو -- موبايل (اختياري، لو فاضي هيستخدم صورة الديسكتوب)</label>
          <input type="file" name="image_mobile" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        </div>
        <label className="flex w-fit items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
          <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 accent-[var(--brand-600)]" />
          نشط
        </label>
        {state.status === "error" && <FormMessage>{state.message}</FormMessage>}
        <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
          {!isPending && <Plus className="h-3.5 w-3.5" />}
          {isPending ? "جارٍ الإضافة..." : "إضافة البانر"}
        </Button>
      </form>
    </div>
  );
}
