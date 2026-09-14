"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateHomepageContentAction } from "@/app/admin/(dashboard)/content/actions";
import type { SettingsActionState } from "@/app/admin/(dashboard)/content/actions";
import type { HomepageContent } from "@/lib/services/content";

interface Section {
  key: keyof HomepageContent & string;
  labelAr: string;
  multiline?: boolean;
}

const SECTIONS: { title: string; fields: Section[] }[] = [
  {
    title: "قسم صندوق جرين بوكس",
    fields: [
      { key: "greenBoxTitle_ar", labelAr: "العنوان (عربي)" },
      { key: "greenBoxTitle_en", labelAr: "العنوان (إنجليزي)" },
      { key: "greenBoxDescription_ar", labelAr: "الوصف (عربي)", multiline: true },
      { key: "greenBoxDescription_en", labelAr: "الوصف (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "قسم نقاط الولاء",
    fields: [
      { key: "loyaltyTitle_ar", labelAr: "العنوان (عربي)" },
      { key: "loyaltyTitle_en", labelAr: "العنوان (إنجليزي)" },
      { key: "loyaltyDescription_ar", labelAr: "الوصف (عربي)", multiline: true },
      { key: "loyaltyDescription_en", labelAr: "الوصف (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "قسم الاشتراكات الأسبوعية",
    fields: [
      { key: "subscriptionTitle_ar", labelAr: "العنوان (عربي)" },
      { key: "subscriptionTitle_en", labelAr: "العنوان (إنجليزي)" },
      { key: "subscriptionDescription_ar", labelAr: "الوصف (عربي)", multiline: true },
      { key: "subscriptionDescription_en", labelAr: "الوصف (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "قسم الدعوة الختامية",
    fields: [
      { key: "finalCtaTitle_ar", labelAr: "العنوان (عربي)" },
      { key: "finalCtaTitle_en", labelAr: "العنوان (إنجليزي)" },
      { key: "finalCtaDescription_ar", labelAr: "الوصف (عربي)", multiline: true },
      { key: "finalCtaDescription_en", labelAr: "الوصف (إنجليزي)", multiline: true },
    ],
  },
];

export function HomepageContentForm({ content }: { content: HomepageContent | null }) {
  const [state, formAction, isPending] = useActionState(updateHomepageContentAction, {
    status: "idle",
  } as SettingsActionState);

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-muted">
        هنا تقدر تغيّر نصوص أقسام الترويج في الصفحة الرئيسية. اترك أي حقل فاضي عشان يظهر النص الافتراضي بدل منه.
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
        {isPending ? "جارٍ الحفظ..." : "حفظ محتوى الصفحة الرئيسية"}
      </Button>
    </form>
  );
}
