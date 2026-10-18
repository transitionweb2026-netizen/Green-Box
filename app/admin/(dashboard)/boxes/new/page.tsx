import { Sparkles } from "lucide-react";
import { BoxForm } from "@/components/admin/box-form";
import { createBoxAction } from "../actions";

export default function NewBoxPage() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">صندوق جديد</h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        بعد إنشاء الصندوق هتقدر ترفع صورته وتحدد محتوياته -- احفظ البيانات الأساسية الأول.
      </p>
      <div className="mt-6">
        <BoxForm action={createBoxAction} />
      </div>
    </div>
  );
}
