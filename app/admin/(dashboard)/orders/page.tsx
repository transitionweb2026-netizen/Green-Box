import Link from "next/link";
import { adminListOrders } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import type { OrderStatus } from "@/types/database";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PREPARING: "جارٍ التحضير",
  PACKING: "جارٍ التغليف",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: OrderStatus; q?: string; page?: string }>;
}) {
  const { status, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { orders, total, pageSize } = await adminListOrders({ status, search: q, page, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">الطلبات</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1 text-sm ${!status ? "bg-brand-600 text-white" : "bg-zinc-100 text-foreground"}`}
        >
          الكل
        </Link>
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm ${status === s ? "bg-brand-600 text-white" : "bg-zinc-100 text-foreground"}`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <form className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ابحث برقم الطلب..."
          className="h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm"
        />
      </form>

      <div className="mt-4">
        {orders.length === 0 ? (
          <Card className="text-center text-muted">لا يوجد طلبات.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2 text-start">رقم الطلب</th>
                  <th className="px-4 py-2 text-start">العميل</th>
                  <th className="px-4 py-2 text-start">التاريخ</th>
                  <th className="px-4 py-2 text-start">الإجمالي</th>
                  <th className="px-4 py-2 text-start">الحالة</th>
                  <th className="px-4 py-2 text-start">الدفع</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-brand-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${order.id}`} className="text-brand-700 hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{order.profiles?.full_name ?? order.profiles?.email ?? "—"}</td>
                    <td className="px-4 py-2 text-muted">{new Date(order.created_at).toLocaleDateString("ar")}</td>
                    <td className="px-4 py-2">{formatPrice(order.total, "ar")}</td>
                    <td className="px-4 py-2">{STATUS_LABELS[order.status]}</td>
                    <td className="px-4 py-2">{order.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?page=${p}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm ${
                  p === page ? "border-brand-600 bg-brand-600 text-white" : "border-border hover:bg-brand-50"
                }`}
              >
                {p}
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
