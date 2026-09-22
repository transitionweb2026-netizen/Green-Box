"use client";

import { useRef, useState, useTransition } from "react";
import { AppImage as Image } from "@/components/ui/app-image";
import { ImagePlus, Star, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import {
  deleteProductImageAction,
  setPrimaryProductImageAction,
  uploadProductImageAction,
} from "@/app/admin/(dashboard)/products/actions";
import { cn } from "@/lib/utils/cn";
import type { ProductImage } from "@/lib/services/catalog";

export function ProductImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const hasPrimary = images.some((image) => image.is_primary);

  return (
    <Card tone="glass">
      <h2 className="mb-4 font-bold text-foreground">الصور</h2>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => {
          const isPrimary = image.is_primary || (!hasPrimary && index === 0);
          return (
            <div
              key={image.id}
              className={cn(
                "relative h-24 w-24 overflow-hidden rounded-xl border shadow-sm",
                isPrimary ? "border-brand-500 ring-2 ring-brand-300" : "border-border",
              )}
            >
              <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
              {isPrimary && (
                <span className="absolute bottom-1 start-1 rounded-full bg-brand-gradient px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                  رئيسية
                </span>
              )}
              {!image.is_primary && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => setPrimaryProductImageAction(productId, image.id))}
                  className="absolute bottom-1 start-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-sm hover:bg-white"
                  aria-label="تعيين كصورة رئيسية"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => deleteProductImageAction(productId, image.id, image.url))}
                className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-sm"
                aria-label="حذف الصورة"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        <form
          ref={formRef}
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await uploadProductImageAction(productId, formData);
              if (result.status === "error") {
                setError(result.message ?? "فشل رفع الصورة");
              } else {
                formRef.current?.reset();
              }
            });
          }}
        >
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-strong text-muted transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700">
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs font-medium">إضافة</span>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isPending}
              onChange={(e) => {
                if (e.target.files?.length) formRef.current?.requestSubmit();
              }}
              className="hidden"
            />
          </label>
        </form>
      </div>
      {isPending && <p className="mt-3 text-sm text-muted">جارٍ الرفع...</p>}
      <FormMessage>{error}</FormMessage>
    </Card>
  );
}
