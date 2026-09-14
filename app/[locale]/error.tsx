"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/empty-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24">
      <ErrorState
        title={t("title")}
        description={t("description")}
        action={
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            {t("retry")}
          </Button>
        }
      />
    </div>
  );
}
