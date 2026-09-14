"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { archiveProductAction } from "@/app/admin/(dashboard)/products/actions";

export function ArchiveProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg disabled:opacity-50"
      onClick={() => {
        if (confirm(`متأكد من إخفاء منتج "${productName}"؟`)) {
          startTransition(() => archiveProductAction(productId));
        }
      }}
    >
      <Archive className="h-3.5 w-3.5" />
      {isPending ? "..." : "إخفاء"}
    </button>
  );
}
