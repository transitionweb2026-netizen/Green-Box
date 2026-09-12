"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { deleteProductImageAction, uploadProductImageAction } from "@/app/admin/(dashboard)/products/actions";
import type { ProductImage } from "@/lib/services/catalog";

export function ProductImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <h2 className="mb-3 font-semibold text-foreground">الصور</h2>
      <div className="flex flex-wrap gap-3">
        {images.map((image) => (
          <div key={image.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
            <Image src={image.url} alt="" fill className="object-cover" />
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => deleteProductImageAction(productId, image.id, image.url))}
              className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white"
              aria-label="حذف الصورة"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await uploadProductImageAction(productId, formData);
            formRef.current?.reset();
          });
        }}
        className="mt-3"
      >
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.files?.length) formRef.current?.requestSubmit();
          }}
          className="text-sm"
        />
        {isPending && <p className="mt-1 text-sm text-muted">جارٍ الرفع...</p>}
      </form>
    </div>
  );
}
