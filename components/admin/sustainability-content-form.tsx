"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateSustainabilityContentAction } from "@/app/admin/(dashboard)/content/actions";
import type { SettingsActionState } from "@/app/admin/(dashboard)/content/actions";
import type { SustainabilityContent } from "@/lib/services/content";

interface Field {
  key: keyof SustainabilityContent & string;
  labelAr: string;
  multiline?: boolean;
}

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: "العنوان والفقرة الرئيسية",
    fields: [
      { key: "heading_ar", labelAr: "العنوان (عربي)" },
      { key: "heading_en", labelAr: "العنوان (إنجليزي)" },
      { key: "body_ar", labelAr: "الفقرة (عربي)", multiline: true },
      { key: "body_en", labelAr: "الفقرة (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "الركيزة الأولى",
    fields: [
      { key: "pillar1Title_ar", labelAr: "العنوان (عربي)" },
      { key: "pillar1Title_en", labelAr: "العنوان (إنجليزي)" },
      { key: "pillar1Body_ar", labelAr: "الوصف (عربي)", multiline: true },
      { key: "pillar1Body_en", labelAr: "الوصف (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "الركيزة الثانية",
    fields: [
      { key: "pillar2Title_ar", labelAr: "العنوان (عربي)" },
      { key: "pillar2Title_en", labelAr: "العنوان (إنجليزي)" },
      { key: "pillar2Body_ar", labelAr: "الوصف (عربي)", multiline: true },
      { key: "pillar2Body_en", labelAr: "الوصف (إنجليزي)", multiline: true },
    ],
  },
  {
    title: "الركيزة الثالثة",
    fields: [
      { key: "pillar3Title_ar", labelAr: "العنوان (عربي)" },
      { key: "pillar3Title_en", labelAr: "العنوان (إنجليزي)" },
      { key: "pillar3Body_ar", labelAr: "الوصف (عربي)", multiline: true },
      { key: "pillar3Body_en", labelAr: "الوصف (إنجليزي)", multiline: true },
    ],
  },
];

export function SustainabilityContentForm({ content }: { content: SustainabilityContent | null }) {
  const [state, formAction, isPending] = useActionState(updateSustainabilityContentAction, { status: "idle" } as SettingsActionState);

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-muted">محتوى صفحة &quot;الاستدامة&quot;. اترك أي حقل فاضي عشان يظهر النص الافتراضي بدل منه.</p>
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
        {isPending ? "جارٍ الحفظ..." : "حفظ صفحة الاستدامة"}
      </Button>
    </form>
  );
}
