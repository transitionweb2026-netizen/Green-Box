"use client";

import { useTransition } from "react";
import { PowerOff } from "lucide-react";

export function DeactivateButton({
  confirmMessage,
  action,
}: {
  confirmMessage: string;
  action: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg disabled:opacity-50"
      onClick={() => {
        if (confirm(confirmMessage)) startTransition(() => action());
      }}
    >
      <PowerOff className="h-3.5 w-3.5" />
      {isPending ? "..." : "تعطيل"}
    </button>
  );
}
