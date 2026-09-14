"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/empty-state";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center py-24">
      <ErrorState
        title="حصل خطأ غير متوقع"
        description="معلش، حصلت مشكلة في تحميل الصفحة. جرب تاني."
        action={
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        }
      />
    </div>
  );
}
