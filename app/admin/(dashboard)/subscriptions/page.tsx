import { adminListSubscriptions } from "@/lib/services/subscriptions";
import { Card } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "نشط", PAUSED: "متوقف مؤقتًا", CANCELLED: "ملغي" };

export default async function AdminSubscriptionsPage() {
  const { subscriptions } = await adminListSubscriptions(1, 50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">الاشتراكات الأسبوعية</h1>
      <p className="mt-1 text-sm text-muted">
        عرض فقط -- قواعد التجديد التلقائي وتوليد الطلبات الأسبوعية لسه مش متفق عليها من إدارة المتجر (راجع DECISIONS.md).
      </p>

      <div className="mt-6">
        {subscriptions.length === 0 ? (
          <Card className="text-center text-muted">لا توجد اشتراكات بعد.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2 text-start">العميل</th>
                  <th className="px-4 py-2 text-start">الحالة</th>
                  <th className="px-4 py-2 text-start">تاريخ البدء</th>
                  <th className="px-4 py-2 text-start">يوم التوصيل</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2">{sub.profiles?.full_name ?? sub.profiles?.email}</td>
                    <td className="px-4 py-2">{STATUS_LABELS[sub.status] ?? sub.status}</td>
                    <td className="px-4 py-2 text-muted">{sub.start_date}</td>
                    <td className="px-4 py-2 text-muted">{sub.day_of_week}</td>
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
