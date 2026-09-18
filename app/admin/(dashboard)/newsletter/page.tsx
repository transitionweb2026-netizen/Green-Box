import { Mail } from "lucide-react";
import { adminListNewsletterSubscribers } from "@/lib/services/newsletter";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteNewsletterSubscriberAction } from "./actions";

export default async function AdminNewsletterPage() {
  const subscribers = await adminListNewsletterSubscribers();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">النشرة البريدية</h1>
        <span className="text-sm font-semibold text-muted">{subscribers.length} مشترك</span>
      </div>

      <div className="mt-6">
        {subscribers.length === 0 ? (
          <EmptyState icon={<Mail className="h-7 w-7" />} title="لا يوجد مشتركين في النشرة البريدية بعد." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">البريد الإلكتروني</th>
                  <th className="px-4 py-3 text-start font-semibold">اللغة</th>
                  <th className="px-4 py-3 text-start font-semibold">تاريخ الاشتراك</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-foreground" dir="ltr">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-muted">{subscriber.locale === "en" ? "إنجليزي" : "عربي"}</td>
                    <td className="px-4 py-3 text-muted">{new Date(subscriber.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmMessage={`متأكد من حذف "${subscriber.email}" من النشرة البريدية؟`}
                        action={deleteNewsletterSubscriberAction.bind(null, subscriber.id)}
                      />
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
