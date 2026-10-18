"use client";

import { useActionState } from "react";
import { Eraser, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateTranslationsAction, type TranslationsActionState } from "@/app/admin/(dashboard)/translations/actions";

export interface EditableKey {
  path: string;
  defaultEn: string;
  defaultAr: string;
  currentEn: string;
  currentAr: string;
}

/** A single key's current value is "long" when either language's text
 * would wrap awkwardly in a one-line input -- same length-based heuristic
 * either way, since admin-entered replacement text can be longer or
 * shorter than the shipped default. */
function isMultiline(key: EditableKey): boolean {
  return key.defaultEn.length > 60 || key.defaultAr.length > 60 || key.defaultEn.includes("\n") || key.defaultAr.includes("\n");
}

export function TranslationEditor({ namespace, keys }: { namespace: string; keys: EditableKey[] }) {
  const [state, formAction, isPending] = useActionState(updateTranslationsAction, {
    status: "idle",
  } as TranslationsActionState);

  function resetField(id: string) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.value = "";
  }

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted">
        اترك أي حقل فاضي عشان يظهر النص الأصلي (الافتراضي) بدل منه -- زرار &quot;مسح&quot; بيفضي الحقل بس، لازم تضغط
        &quot;حفظ&quot; بعده عشان يرجع للنص الافتراضي فعليًا.
      </p>
      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-white/50">
        {keys.map((key) => {
          const arId = `ar::${key.path}`;
          const enId = `en::${key.path}`;
          const multiline = isMultiline(key);
          const Field = multiline ? Textarea : Input;
          return (
            <div key={key.path} className="p-4">
              <p className="mb-2 font-mono text-xs text-muted-2">{key.path}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label htmlFor={arId}>عربي</Label>
                    <button
                      type="button"
                      onClick={() => resetField(arId)}
                      className="flex items-center gap-1 text-xs text-muted-2 hover:text-deep-700"
                    >
                      <Eraser className="h-3 w-3" />
                      مسح
                    </button>
                  </div>
                  <Field
                    id={arId}
                    name={arId}
                    dir="rtl"
                    defaultValue={key.currentAr}
                    placeholder={key.defaultAr}
                    {...(multiline ? { rows: 2 } : {})}
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label htmlFor={enId}>إنجليزي</Label>
                    <button
                      type="button"
                      onClick={() => resetField(enId)}
                      className="flex items-center gap-1 text-xs text-muted-2 hover:text-deep-700"
                    >
                      <Eraser className="h-3 w-3" />
                      مسح
                    </button>
                  </div>
                  <Field
                    id={enId}
                    name={enId}
                    dir="ltr"
                    defaultValue={key.currentEn}
                    placeholder={key.defaultEn}
                    {...(multiline ? { rows: 2 } : {})}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.status === "success" && <FormMessage variant="success">تم الحفظ بنجاح.</FormMessage>}
      {state.status === "error" && <FormMessage>{state.message ?? "حصل خطأ أثناء الحفظ. حاول تاني."}</FormMessage>}
      <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
        {!isPending && <Save className="h-3.5 w-3.5" />}
        {isPending ? "جارٍ الحفظ..." : `حفظ نصوص "${namespace}"`}
      </Button>
    </form>
  );
}
