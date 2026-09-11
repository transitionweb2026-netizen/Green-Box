"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        حصل خطأ غير متوقع
      </h1>
      <p className="max-w-md text-muted">
        معلش، حصلت مشكلة في تحميل الصفحة. جرب تاني.
      </p>
      <Button onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
