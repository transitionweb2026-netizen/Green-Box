import Link from "next/link";
import { adminGetDashboardStats } from "@/lib/services/dashboard";
import { formatPrice } from "@/lib/i18n/localized";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";

const STATUS_LABELS_AR: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PREPARING: "جارٍ التحضير",
  PACKING: "جارٍ التغليف",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

export default async function AdminDashboardPage() {
  const stats = await adminGetDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="إجمالي الطلبات" value={stats.totalOrders} />
        <StatCard label="طلبات قيد الانتظار" value={stats.pendingOrders} />
        <StatCard label="إيرادات الطلبات المكتملة" value={formatPrice(stats.revenueDelivered, "ar")} />
        <StatCard label="عدد العملاء" value={stats.customerCount} />
        <StatCard label="عدد المنتجات" value={stats.productCount} />
        <StatCard label="منتجات غير متاحة" value={stats.unavailableProductCount} />
      </div>

      <h2 className="mt-8 mb-3 font-semibold text-foreground">أحدث الطلبات</h2>
      {stats.recentOrders.length === 0 ? (
        <Card className="text-center text-muted">لا يوجد طلبات بعد.</Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-start text-muted">
              <tr>
                <th className="px-4 py-2 text-start">رقم الطلب</th>
                <th className="px-4 py-2 text-start">العميل</th>
                <th className="px-4 py-2 text-start">الحالة</th>
                <th className="px-4 py-2 text-start">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-brand-50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/orders/${order.id}`} className="text-brand-700 hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{order.profiles?.full_name ?? order.profiles?.email ?? "—"}</td>
                  <td className="px-4 py-2">{STATUS_LABELS_AR[order.status] ?? order.status}</td>
                  <td className="px-4 py-2">{formatPrice(order.total, "ar")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
