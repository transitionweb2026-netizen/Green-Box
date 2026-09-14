"use client";

import { useState, useTransition } from "react";
import { Pause, Play, Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import {
  adminSetSubscriptionStatusAction,
  adminTriggerRenewalAction,
} from "@/app/admin/(dashboard)/subscriptions/actions";
import type { SubscriptionStatus } from "@/types/database";

export function SubscriptionStatusControl({
  subscriptionId,
  currentStatus,
}: {
  subscriptionId: string;
  currentStatus: SubscriptionStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function apply(status: SubscriptionStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await adminSetSubscriptionStatusAction(subscriptionId, status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حصل خطأ");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {currentStatus === "ACTIVE" && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => apply("PAUSED")}>
          <Pause className="h-3.5 w-3.5" /> إيقاف مؤقت
        </Button>
      )}
      {currentStatus === "PAUSED" && (
        <Button size="sm" disabled={isPending} onClick={() => apply("ACTIVE")}>
          <Play className="h-3.5 w-3.5" /> استئناف
        </Button>
      )}
      {currentStatus !== "CANCELLED" && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => apply("CANCELLED")}>
          <Ban className="h-3.5 w-3.5" /> إلغاء الاشتراك
        </Button>
      )}
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}

const OUTCOME_LABELS: Record<string, string> = {
  created: "تم إنشاء طلب جديد",
  skipped: "لم يتم إنشاء طلب",
};

export function SubscriptionRenewalControl({ subscriptionId }: { subscriptionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ outcome: string; reason: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function trigger() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await adminTriggerRenewalAction(subscriptionId);
        setResult({ outcome: res.outcome, reason: res.reason });
      } catch (err) {
        setError(err instanceof Error ? err.message : "حصل خطأ");
      }
    });
  }

  return (
    <div>
      <Button size="sm" variant="outline" disabled={isPending} loading={isPending} onClick={trigger}>
        {!isPending && <RefreshCw className="h-3.5 w-3.5" />}
        توليد طلب الآن
      </Button>
      {result && (
        <p className="mt-2 text-sm text-muted">
          {OUTCOME_LABELS[result.outcome] ?? result.outcome}
          {result.reason ? ` — ${result.reason}` : ""}
        </p>
      )}
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}
