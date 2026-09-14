import { notFound } from "next/navigation";
import Link from "next/link";
import { User, MapPin, Clock, Wallet, History } from "lucide-react";
import { adminGetSubscription, adminListOrdersForSubscription } from "@/lib/services/subscriptions";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUS_TONE, ORDER_STATUS_TONE, toneFor } from "@/lib/ui/status";
import { SubscriptionStatusControl, SubscriptionRenewalControl } from "@/components/admin/subscription-controls";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "نشط", PAUSED: "متوقف مؤقتًا", CANCELLED: "ملغي" };
const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PREPARING: "جارٍ التحضير",
  PACKING: "جارٍ التغليف",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

export default async function AdminSubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [subscription, orders] = await Promise.all([adminGetSubscription(id), adminListOrdersForSubscription(id)]);
  if (!subscription) notFound();

  const address = subscription.addresses;
  const slot = subscription.delivery_time_slots;
  const paymentMethod = subscription.payment_methods;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/subscriptions" className="text-sm font-semibold text-brand-700 hover:underline">
            ← الاشتراكات
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground">
            اشتراك {subscription.profiles?.full_name ?? subscription.profiles?.email}
          </h1>
        </div>
        <Badge tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)}>
          {STATUS_LABELS[subscription.status] ?? subscription.status}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-bold text-foreground">إدارة الاشتراك</h2>
            <SubscriptionStatusControl subscriptionId={subscription.id} currentStatus={subscription.status} />
            <div className="mt-4 border-t border-border/70 pt-4">
              <SubscriptionRenewalControl subscriptionId={subscription.id} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-foreground">المنتجات</h2>
            <div className="divide-y divide-border/70">
              {subscription.subscription_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">
                    {item.products.name_ar} × {item.quantity}
                  </span>
                  <span className="font-semibold text-foreground">{formatPrice(item.products.price, "ar")}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
              <History className="h-4 w-4 text-brand-600" /> الطلبات المولّدة
            </h2>
            {orders.length === 0 ? (
              <p className="text-sm text-muted">لم يتم توليد أي طلبات لهذا الاشتراك بعد.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {orders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                      {order.order_number}
                    </Link>
                    <span className="text-muted">{order.delivery_date}</span>
                    <Badge tone={toneFor(ORDER_STATUS_TONE, order.status)}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <span className="font-semibold text-foreground">{formatPrice(order.total, "ar")}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <User className="h-4 w-4 text-brand-600" /> العميل
            </h2>
            <p className="text-sm text-foreground">{subscription.profiles?.full_name ?? "—"}</p>
            <p className="text-sm text-muted">{subscription.profiles?.email}</p>
            <p className="text-sm text-muted">{subscription.profiles?.phone}</p>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <MapPin className="h-4 w-4 text-brand-600" /> عنوان التوصيل
            </h2>
            {address ? (
              <>
                <p className="text-sm text-foreground">
                  {address.recipient_name} — {address.phone}
                </p>
                <p className="text-sm text-muted">{address.detailed_address}</p>
                {address.landmark && <p className="text-sm text-muted">{address.landmark}</p>}
              </>
            ) : (
              <p className="text-sm text-muted">لا يوجد عنوان محدد</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <Clock className="h-4 w-4 text-brand-600" /> ميعاد التوصيل
            </h2>
            <p className="text-sm font-semibold text-foreground">
              {subscription.day_of_week != null ? WEEKDAYS_AR[subscription.day_of_week] : "—"}
            </p>
            {slot && (
              <p className="text-sm text-muted">
                {slot.label_ar} ({slot.start_time} - {slot.end_time})
              </p>
            )}
            <p className="mt-2 text-sm text-muted">أقرب ميعاد: {subscription.next_delivery_date ?? "غير محدد"}</p>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <Wallet className="h-4 w-4 text-brand-600" /> طريقة الدفع
            </h2>
            <p className="text-sm text-foreground">{paymentMethod?.name_ar ?? "—"}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
