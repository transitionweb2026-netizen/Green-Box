"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { archiveBoxAction } from "@/app/admin/(dashboard)/boxes/actions";

export function ArchiveBoxButton({ boxId, boxName }: { boxId: string; boxName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg disabled:opacity-50"
      onClick={() => {
        if (confirm(`متأكد من إخفاء صندوق "${boxName}"؟`)) {
          startTransition(() => archiveBoxAction(boxId));
        }
      }}
    >
      <Archive className="h-3.5 w-3.5" />
      {isPending ? "..." : "إخفاء"}
    </button>
  );
}
