import Link from "next/link";
import { adminListTimeSlots } from "@/lib/services/delivery";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeactivateButton } from "@/components/admin/deactivate-button";
import { deactivateSlotAction } from "./actions";

export default async function AdminDeliverySlotsPage() {
  const slots = await adminListTimeSlots();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">مواعيد التوصيل</h1>
        <Link href="/admin/delivery-slots/new" className={buttonVariants({ size: "sm" })}>
          إضافة ميعاد جديد
        </Link>
      </div>

      <div className="mt-6">
        {slots.length === 0 ? (
          <Card className="text-center text-muted">لا توجد مواعيد توصيل بعد.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2 text-start">الاسم</th>
                  <th className="px-4 py-2 text-start">الوقت</th>
                  <th className="px-4 py-2 text-start">الترتيب</th>
                  <th className="px-4 py-2 text-start">الحالة</th>
                  <th className="px-4 py-2 text-start">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-border last:border-b-0 hover:bg-brand-50">
                    <td className="px-4 py-2">{slot.label_ar}</td>
                    <td className="px-4 py-2 text-muted">
                      {slot.start_time} - {slot.end_time}
                    </td>
                    <td className="px-4 py-2">{slot.display_order}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          slot.is_active ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {slot.is_active ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="flex gap-3 px-4 py-2">
                      <Link href={`/admin/delivery-slots/${slot.id}/edit`} className="text-brand-700 hover:underline">
                        تعديل
                      </Link>
                      {slot.is_active && (
                        <DeactivateButton
                          confirmMessage={`متأكد من تعطيل ميعاد "${slot.label_ar}"؟`}
                          action={deactivateSlotAction.bind(null, slot.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
