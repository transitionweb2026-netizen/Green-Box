import Link from "next/link";
import { Search, Inbox } from "lucide-react";
import { adminListOrders } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils/cn";
import { ORDER_STATUS_TONE, PAYMENT_STATUS_TONE, toneFor } from "@/lib/ui/status";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">الطلبات</h1>
        <p className="text-sm text-muted">{total} طلب</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
            !status ? "bg-brand-gradient text-white shadow-sm" : "bg-white/70 text-foreground hover:bg-brand-50",
          )}
        >
          الكل
        </Link>
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              status === s ? "bg-brand-gradient text-white shadow-sm" : "bg-white/70 text-foreground hover:bg-brand-50",
            )}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <form className="relative mt-4 max-w-sm">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ابحث برقم الطلب..."
          className="h-10 w-full rounded-xl border border-border bg-white/80 ps-10 pe-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
        />
      </form>

      <div className="mt-5">
        {orders.length === 0 ? (
          <EmptyState icon={<Inbox className="h-7 w-7" />} title="لا يوجد طلبات." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">رقم الطلب</th>
                  <th className="px-4 py-3 text-start font-semibold">العميل</th>
                  <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-start font-semibold">الإجمالي</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">الدفع</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{order.profiles?.full_name ?? order.profiles?.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{new Date(order.created_at).toLocaleDateString("ar")}</td>
                    <td className="px-4 py-3 font-bold text-deep-700">{formatPrice(order.total, "ar")}</td>
                    <td className="px-4 py-3">
                      <Badge tone={toneFor(ORDER_STATUS_TONE, order.status)}>{STATUS_LABELS[order.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={toneFor(PAYMENT_STATUS_TONE, order.payment_status)}>{order.payment_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          rtl
          makeHref={(p) => `?page=${p}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`}
        />
      </div>
    </div>
  );
}
