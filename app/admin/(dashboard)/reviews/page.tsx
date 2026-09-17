import Link from "next/link";
import { Plus, Quote, Star } from "lucide-react";
import { adminListReviews } from "@/lib/services/reviews";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteReviewAction } from "./actions";

export default async function AdminReviewsPage() {
  const reviews = await adminListReviews();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">آراء العملاء</h1>
        <Link href="/admin/reviews/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة رأي جديد
        </Link>
      </div>

      <div className="mt-6">
        {reviews.length === 0 ? (
          <EmptyState icon={<Quote className="h-7 w-7" />} title="لا توجد آراء عملاء بعد." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">العميل</th>
                  <th className="px-4 py-3 text-start font-semibold">الرأي</th>
                  <th className="px-4 py-3 text-start font-semibold">التقييم</th>
                  <th className="px-4 py-3 text-start font-semibold">الترتيب</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{review.customer_name}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted">{review.quote_ar}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5 text-gold-500">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{review.display_order}</td>
                    <td className="px-4 py-3">
                      <Badge tone={review.is_active ? "success" : "neutral"}>{review.is_active ? "نشط" : "معطل"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/reviews/${review.id}/edit`}
                          className="rounded-lg px-2 py-1 text-sm font-semibold text-deep-700 hover:bg-brand-50"
                        >
                          تعديل
                        </Link>
                        <DeleteButton
                          confirmMessage={`متأكد من حذف رأي "${review.customer_name}"؟`}
                          action={deleteReviewAction.bind(null, review.id)}
                        />
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
