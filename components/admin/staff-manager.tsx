"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserMinus, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { adminPromoteByEmailAction, adminDemoteStaffAction } from "@/app/admin/(dashboard)/staff/actions";
import type { Profile } from "@/lib/services/customers";

export function StaffManager({ staff, currentProfileId }: { staff: Profile[]; currentProfileId: string }) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  function promote() {
    setMessage(null);
    startTransition(async () => {
      const result = await adminPromoteByEmailAction(email);
      if (result.status === "success") {
        setMessage({ variant: "success", text: "تمت ترقية المستخدم إلى مسؤول." });
        setEmail("");
      } else {
        setMessage({ variant: "error", text: result.message ?? "حصل خطأ" });
      }
    });
  }

  function demote(profileId: string) {
    if (!confirm("هل تريد إزالة صلاحية المسؤول من هذا المستخدم؟")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await adminDemoteStaffAction(profileId);
      if (result.status === "success") {
        setMessage({ variant: "success", text: "تم إلغاء صلاحية المسؤول." });
      } else {
        setMessage({ variant: "error", text: result.message ?? "حصل خطأ" });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
          <UserPlus className="h-4 w-4 text-brand-600" /> ترقية مستخدم إلى مسؤول
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني للمستخدم"
            className="h-10 w-full max-w-xs rounded-xl border border-border bg-white/80 px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
          />
          <Button size="sm" disabled={isPending} loading={isPending} onClick={promote}>
            ترقية
          </Button>
        </div>
        {message && <FormMessage variant={message.variant}>{message.text}</FormMessage>}
      </Card>

      <Card tone="flat" className="overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-brand-50/50 text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">الاسم</th>
              <th className="px-4 py-3 text-start font-semibold">البريد الإلكتروني</th>
              <th className="px-4 py-3 text-start font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                <td className="px-4 py-3 text-foreground">
                  <span className="flex items-center gap-2">
                    {member.full_name ?? "—"}
                    {member.id === currentProfileId && (
                      <span className="flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        <ShieldCheck className="h-3 w-3" /> أنت
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{member.email}</td>
                <td className="px-4 py-3 text-end">
                  {member.id !== currentProfileId && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => demote(member.id)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg"
                    >
                      <UserMinus className="h-3.5 w-3.5" /> إلغاء الصلاحية
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
