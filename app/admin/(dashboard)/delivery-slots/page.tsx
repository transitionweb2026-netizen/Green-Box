import Link from "next/link";
import { Plus, Clock } from "lucide-react";
import { adminListTimeSlots } from "@/lib/services/delivery";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeactivateButton } from "@/components/admin/deactivate-button";
import { deactivateSlotAction } from "./actions";

export default async function AdminDeliverySlotsPage() {
  const slots = await adminListTimeSlots();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">مواعيد التوصيل</h1>
        <Link href="/admin/delivery-slots/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة ميعاد جديد
        </Link>
      </div>

      <div className="mt-6">
        {slots.length === 0 ? (
          <EmptyState icon={<Clock className="h-7 w-7" />} title="لا توجد مواعيد توصيل بعد." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-start font-semibold">الوقت</th>
                  <th className="px-4 py-3 text-start font-semibold">الترتيب</th>
                  <th className="px-4 py-3 text-start font-semibold">الحد الأقصى للطلبات</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{slot.label_ar}</td>
                    <td className="px-4 py-3 text-muted" dir="ltr">
                      {slot.start_time} - {slot.end_time}
                    </td>
                    <td className="px-4 py-3 text-muted">{slot.display_order}</td>
                    <td className="px-4 py-3 text-muted">{slot.max_orders ?? "غير محدود"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={slot.is_active ? "success" : "neutral"}>{slot.is_active ? "نشط" : "معطل"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/delivery-slots/${slot.id}/edit`}
                          className="rounded-lg px-2 py-1 text-sm font-semibold text-deep-700 hover:bg-brand-50"
                        >
                          تعديل
                        </Link>
                        {slot.is_active && (
                          <DeactivateButton
                            confirmMessage={`متأكد من تعطيل ميعاد "${slot.label_ar}"؟`}
                            action={deactivateSlotAction.bind(null, slot.id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
