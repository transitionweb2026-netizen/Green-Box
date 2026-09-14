import Link from "next/link";
import { ShoppingBag, Clock, Wallet, Users, Package, PackageX, Inbox } from "lucide-react";
import { adminGetDashboardStats } from "@/lib/services/dashboard";
import { formatPrice } from "@/lib/i18n/localized";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ORDER_STATUS_TONE, toneFor } from "@/lib/ui/status";

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
      <h1 className="text-2xl font-extrabold text-foreground">لوحة التحكم</h1>
      <p className="mt-1 text-sm text-muted">نظرة عامة على أداء المتجر.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="إجمالي الطلبات" value={stats.totalOrders} icon={ShoppingBag} tone="brand" />
        <StatCard label="طلبات قيد الانتظار" value={stats.pendingOrders} icon={Clock} tone="warning" />
        <StatCard label="إيرادات الطلبات المكتملة" value={formatPrice(stats.revenueDelivered, "ar")} icon={Wallet} tone="deep" />
        <StatCard label="عدد العملاء" value={stats.customerCount} icon={Users} tone="brand" />
        <StatCard label="عدد المنتجات" value={stats.productCount} icon={Package} tone="deep" />
        <StatCard label="منتجات غير متاحة" value={stats.unavailableProductCount} icon={PackageX} tone="danger" />
      </div>

      <h2 className="mt-10 mb-3 text-lg font-bold text-foreground">أحدث الطلبات</h2>
      {stats.recentOrders.length === 0 ? (
        <EmptyState icon={<Inbox className="h-7 w-7" />} title="لا يوجد طلبات بعد." />
      ) : (
        <Card tone="flat" className="overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-brand-50/50 text-start text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">رقم الطلب</th>
                <th className="px-4 py-3 text-start font-semibold">العميل</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{order.profiles?.full_name ?? order.profiles?.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneFor(ORDER_STATUS_TONE, order.status)}>{STATUS_LABELS_AR[order.status] ?? order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-deep-700">{formatPrice(order.total, "ar")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
