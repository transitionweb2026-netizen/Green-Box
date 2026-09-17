"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateFaqContentAction } from "@/app/admin/(dashboard)/content/actions";
import type { SettingsActionState } from "@/app/admin/(dashboard)/content/actions";
import type { FaqContent } from "@/lib/services/content";

interface Section {
  key: keyof FaqContent & string;
  labelAr: string;
  multiline?: boolean;
}

const SECTIONS: { title: string; fields: Section[] }[] = [
  {
    title: "السؤال الأول",
    fields: [
      { key: "question1_ar", labelAr: "السؤال (عربي)" },
      { key: "question1_en", labelAr: "السؤال (إنجليزي)" },
      { key: "answer1_ar", labelAr: "الإجابة (عربي)", multiline: true },
      { key: "answer1_en", labelAr: "الإجابة (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "السؤال الثاني",
    fields: [
      { key: "question2_ar", labelAr: "السؤال (عربي)" },
      { key: "question2_en", labelAr: "السؤال (إنجليزي)" },
      { key: "answer2_ar", labelAr: "الإجابة (عربي)", multiline: true },
      { key: "answer2_en", labelAr: "الإجابة (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "السؤال الثالث",
    fields: [
      { key: "question3_ar", labelAr: "السؤال (عربي)" },
      { key: "question3_en", labelAr: "السؤال (إنجليزي)" },
      { key: "answer3_ar", labelAr: "الإجابة (عربي)", multiline: true },
      { key: "answer3_en", labelAr: "الإجابة (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "زر الدعوة لاتخاذ إجراء",
    fields: [
      { key: "ctaLabel_ar", labelAr: "نص الزر (عربي)" },
      { key: "ctaLabel_en", labelAr: "نص الزر (إنجليزي)" },
    ],
  },
];

export function FaqContentForm({ content }: { content: FaqContent | null }) {
  const [state, formAction, isPending] = useActionState(updateFaqContentAction, { status: "idle" } as SettingsActionState);

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-muted">
        هنا تقدر تغيّر أسئلة وإجابات قسم الأسئلة الشائعة اللي بيظهر فوق الفوتر في كل صفحات الموقع. اترك أي حقل فاضي عشان يظهر النص الافتراضي بدل منه.
      </p>
      {SECTIONS.map((section) => (
        <div key={section.title} className="rounded-2xl border border-border bg-white/50 p-4">
          <h3 className="mb-3 text-sm font-bold text-foreground">{section.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.key} className={field.multiline ? "sm:col-span-2" : undefined}>
                <Label htmlFor={field.key}>{field.labelAr}</Label>
                {field.multiline ? (
                  <Textarea id={field.key} name={field.key} rows={2} defaultValue={content?.[field.key] ?? ""} />
                ) : (
                  <Input id={field.key} name={field.key} defaultValue={content?.[field.key] ?? ""} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
      {state.status === "error" && <FormMessage>حصل خطأ أثناء الحفظ. حاول تاني.</FormMessage>}
      <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
        {!isPending && <Save className="h-3.5 w-3.5" />}
        {isPending ? "جارٍ الحفظ..." : "حفظ الأسئلة الشائعة"}
      </Button>
    </form>
  );
}
