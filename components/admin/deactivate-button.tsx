"use client";

import { useTransition } from "react";

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
      className="text-sm text-danger hover:underline disabled:opacity-50"
      onClick={() => {
        if (confirm(confirmMessage)) startTransition(() => action());
      }}
    >
      {isPending ? "..." : "تعطيل"}
    </button>
  );
}
