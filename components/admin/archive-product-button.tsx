"use client";

import { useTransition } from "react";
import { archiveProductAction } from "@/app/admin/(dashboard)/products/actions";

export function ArchiveProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="text-sm text-danger hover:underline disabled:opacity-50"
      onClick={() => {
        if (confirm(`متأكد من إخفاء منتج "${productName}"؟`)) {
          startTransition(() => archiveProductAction(productId));
        }
      }}
    >
      {isPending ? "..." : "إخفاء"}
    </button>
  );
}
