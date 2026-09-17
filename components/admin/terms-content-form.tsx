"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateTermsContentAction } from "@/app/admin/(dashboard)/content/actions";
import type { SettingsActionState } from "@/app/admin/(dashboard)/content/actions";
import type { TermsContent } from "@/lib/services/content";

export function TermsContentForm({ content }: { content: TermsContent | null }) {
  const [state, formAction, isPending] = useActionState(updateTermsContentAction, { status: "idle" } as SettingsActionState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted">
        النص اللي بيظهر تحت قسم الأسئلة الشائعة فوق الفوتر في كل صفحات الموقع. اترك الحقل فاضي عشان يظهر النص الافتراضي بدل منه.
      </p>
      <div>
        <Label htmlFor="body_ar">النص بالعربي</Label>
        <Textarea id="body_ar" name="body_ar" rows={3} defaultValue={content?.body_ar ?? ""} />
      </div>
      <div>
        <Label htmlFor="body_en">النص بالإنجليزي</Label>
        <Textarea id="body_en" name="body_en" rows={3} defaultValue={content?.body_en ?? ""} />
      </div>
      {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
      {state.status === "error" && <FormMessage>حصل خطأ أثناء الحفظ. حاول تاني.</FormMessage>}
      <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
        {!isPending && <Save className="h-3.5 w-3.5" />}
        {isPending ? "جارٍ الحفظ..." : "حفظ الشروط والأحكام"}
      </Button>
    </form>
  );
}
