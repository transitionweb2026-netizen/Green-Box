"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import type { ReviewActionState } from "@/app/admin/(dashboard)/reviews/actions";
import type { Review } from "@/lib/services/reviews";

export function ReviewForm({
  review,
  action,
}: {
  review?: Review;
  action: (state: ReviewActionState, formData: FormData) => Promise<ReviewActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as ReviewActionState);

  return (
    <Card tone="glass" className="max-w-lg">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="customer_name">اسم العميل</Label>
          <Input id="customer_name" name="customer_name" defaultValue={review?.customer_name} required />
        </div>
        <div>
          <Label htmlFor="quote_ar">رأي العميل بالعربي</Label>
          <Textarea id="quote_ar" name="quote_ar" defaultValue={review?.quote_ar} rows={3} required />
        </div>
        <div>
          <Label htmlFor="quote_en">رأي العميل بالإنجليزي (اختياري)</Label>
          <Textarea id="quote_en" name="quote_en" defaultValue={review?.quote_en ?? ""} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rating">التقييم (1-5)</Label>
            <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={review?.rating ?? 5} />
          </div>
          <div>
            <Label htmlFor="display_order">ترتيب العرض</Label>
            <Input id="display_order" name="display_order" type="number" defaultValue={review?.display_order ?? 0} />
          </div>
        </div>

        <label className="flex w-fit items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={review?.is_active ?? true}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          نشط (ظاهر للعملاء)
        </label>

        {state.status === "error" && <FormMessage>{state.message}</FormMessage>}

        <Button type="submit" disabled={isPending} loading={isPending}>
          {!isPending && <Save className="h-4 w-4" />}
          {isPending ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </form>
    </Card>
  );
}
