"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ImageIcon, Save, Upload } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { uploadBoxImageAction } from "@/app/admin/(dashboard)/boxes/actions";
import type { BoxActionState } from "@/app/admin/(dashboard)/boxes/actions";
import type { Product, ProductImage } from "@/lib/services/catalog";

/**
 * The card's one photo -- deliberately a single direct upload (not the
 * full multi-image/pick-a-primary ProductImageManager used for grocery
 * products), auto-submitting the moment a file is chosen, same pattern
 * as HeroImagesManager/BannerImageSlot. Only shown once the box exists
 * (image upload needs a real product id), same as every other product
 * image flow in this admin.
 */
function BoxImageUpload({ productId, image }: { productId: string; image: ProductImage | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await uploadBoxImageAction(productId, formData);
          if (result.status === "error") setError(result.message ?? "فشل رفع الصورة");
        });
      }}
      className="flex items-center gap-4"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-50">
        {image ? (
          <Image src={image.url} alt="صورة الصندوق" fill sizes="96px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-2">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Upload className="h-4 w-4" />
          {isPending ? "جارٍ الرفع..." : image ? "تغيير الصورة" : "رفع صورة الصندوق"}
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isPending}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
        <p className="mt-1.5 text-xs text-muted">هي الصورة اللي هتظهر في بطاقة الصندوق بالصفحة الرئيسية.</p>
        <FormMessage className="mt-1">{error}</FormMessage>
      </div>
    </form>
  );
}

/**
 * Dedicated "Green Box" form -- NOT the generic grocery ProductForm. A
 * box has no weight-based pricing, no unit label, no reservation
 * requirement, no SKU, and always belongs to the same fixed "Green Box
 * Boxes" category, so none of those fields are shown; the category and
 * slug are resolved server-side (see boxes/actions.ts) instead of asked
 * of the admin. This is what "the controllers didn't feel logical" was
 * about: the old flow reused that full grocery-product form (and its
 * irrelevant fields) for something conceptually different.
 */
export function BoxForm({
  box,
  action,
}: {
  box?: Product & { product_images: ProductImage[] };
  action: (state: BoxActionState, formData: FormData) => Promise<BoxActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as BoxActionState);
  const primaryImage = box?.product_images.find((img) => img.is_primary) ?? box?.product_images[0] ?? null;

  return (
    <div className="max-w-2xl space-y-5">
      {box && (
        <Card tone="glass">
          <h2 className="mb-4 font-bold text-foreground">صورة البطاقة</h2>
          <BoxImageUpload productId={box.id} image={primaryImage} />
        </Card>
      )}

      <form action={formAction} className="space-y-5">
        <Card tone="glass">
          <h2 className="mb-4 font-bold text-foreground">بيانات الصندوق</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name_ar">الاسم بالعربي</Label>
                <Input id="name_ar" name="name_ar" defaultValue={box?.name_ar} required />
              </div>
              <div>
                <Label htmlFor="name_en">الاسم بالإنجليزي</Label>
                <Input id="name_en" name="name_en" defaultValue={box?.name_en ?? ""} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="description_ar">الوصف بالعربي</Label>
                <Textarea id="description_ar" name="description_ar" rows={3} defaultValue={box?.description_ar ?? ""} />
              </div>
              <div>
                <Label htmlFor="description_en">الوصف بالإنجليزي</Label>
                <Textarea id="description_en" name="description_en" rows={3} defaultValue={box?.description_en ?? ""} />
              </div>
            </div>

            <div className="sm:w-48">
              <Label htmlFor="price">السعر (جنيه)</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={box?.price ?? ""} required />
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  name="is_available"
                  defaultChecked={box?.is_available ?? true}
                  className="h-4 w-4 accent-[var(--brand-600)]"
                />
                متاح للبيع
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked={box?.is_featured ?? false}
                  className="h-4 w-4 accent-[var(--brand-600)]"
                />
                صندوق مميز
              </label>
            </div>
          </div>
        </Card>

        {state.status === "error" && <FormMessage>{state.message}</FormMessage>}
        {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}

        <Button type="submit" disabled={isPending} loading={isPending}>
          {!isPending && <Save className="h-4 w-4" />}
          {isPending ? "جارٍ الحفظ..." : box ? "حفظ التعديلات" : "إنشاء الصندوق"}
        </Button>
      </form>
    </div>
  );
}
