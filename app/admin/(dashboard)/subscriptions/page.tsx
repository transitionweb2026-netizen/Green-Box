import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { adminListSubscriptions } from "@/lib/services/subscriptions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SUBSCRIPTION_STATUS_TONE, toneFor } from "@/lib/ui/status";
import { cn } from "@/lib/utils/cn";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "نشط", PAUSED: "متوقف مؤقتًا", CANCELLED: "ملغي" };
const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: "ACTIVE" | "PAUSED" | "CANCELLED"; page?: string }>;
}) {
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { subscriptions, total, pageSize } = await adminListSubscriptions(page, 25, status);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">الاشتراكات الأسبوعية</h1>
      <p className="mt-1 rounded-xl bg-info-bg px-3.5 py-2.5 text-sm text-info">
        الطلبات الأسبوعية بتتولد تلقائيًا كل يوم لكل اشتراك نشط جاء ميعاده. تقدر كمان تولّد طلب لاشتراك معين يدويًا من صفحة تفاصيله.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/subscriptions"
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
            !status ? "bg-brand-gradient text-white shadow-sm" : "bg-white/70 text-foreground hover:bg-brand-50",
          )}
        >
          الكل
        </Link>
        {(Object.keys(STATUS_LABELS) as ("ACTIVE" | "PAUSED" | "CANCELLED")[]).map((s) => (
          <Link
            key={s}
            href={`/admin/subscriptions?status=${s}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              status === s ? "bg-brand-gradient text-white shadow-sm" : "bg-white/70 text-foreground hover:bg-brand-50",
            )}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-5">
        {subscriptions.length === 0 ? (
          <EmptyState icon={<RefreshCw className="h-7 w-7" />} title="لا توجد اشتراكات." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">العميل</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">يوم التوصيل</th>
                  <th className="px-4 py-3 text-start font-semibold">أقرب ميعاد توصيل</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/subscriptions/${sub.id}`} className="font-semibold text-brand-700 hover:underline">
                        {sub.profiles?.full_name ?? sub.profiles?.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={toneFor(SUBSCRIPTION_STATUS_TONE, sub.status)}>{STATUS_LABELS[sub.status] ?? sub.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{sub.day_of_week != null ? WEEKDAYS_AR[sub.day_of_week] : "—"}</td>
                    <td className="px-4 py-3 text-muted">{sub.next_delivery_date ?? "غير محدد"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Pagination page={page} totalPages={totalPages} rtl makeHref={(p) => `?page=${p}${status ? `&status=${status}` : ""}`} />
      </div>
    </div>
  );
}
