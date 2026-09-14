import { notFound } from "next/navigation";
import { User, MapPin, Clock, Wallet, StickyNote, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_TONE, PAYMENT_STATUS_TONE, toneFor } from "@/lib/ui/status";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { PaymentVerificationControl } from "@/components/admin/payment-verification-control";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PREPARING: "جارٍ التحضير",
  PACKING: "جارٍ التغليف",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

interface AddressSnapshot {
  recipient_name: string;
  phone: string;
  governorate: string;
  city: string;
  area: string;
  detailed_address: string;
  landmark?: string;
}

interface SlotSnapshot {
  label_ar: string;
  start_time: string;
  end_time: string;
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", order.profile_id)
    .maybeSingle();

  const address = order.address_snapshot as unknown as AddressSnapshot;
  const slot = order.delivery_slot_snapshot as unknown as SlotSnapshot;
  const latestPayment = order.payments[order.payments.length - 1];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-foreground">طلب رقم {order.order_number}</h1>
        <span className="text-sm text-muted">{new Date(order.created_at).toLocaleString("ar")}</span>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-foreground">حالة الطلب</h2>
              <Badge tone={toneFor(ORDER_STATUS_TONE, order.status)}>{STATUS_LABELS[order.status]}</Badge>
            </div>
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-foreground">المنتجات</h2>
            <div className="divide-y divide-border/70">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">
                    {item.product_name_ar} × {item.quantity}
                  </span>
                  <span className="font-semibold text-foreground">{formatPrice(item.line_total, "ar")}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">الإجمالي الفرعي</span>
                <span>{formatPrice(order.subtotal, "ar")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">رسوم التوصيل</span>
                <span>{formatPrice(order.delivery_fee, "ar")}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">الخصم</span>
                  <span>-{formatPrice(order.discount_amount, "ar")}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-extrabold text-deep-700">
                <span>الإجمالي الكلي</span>
                <span>{formatPrice(order.total, "ar")}</span>
              </div>
            </div>
          </Card>

          {order.customer_notes && (
            <Card>
              <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
                <StickyNote className="h-4 w-4 text-brand-600" /> ملاحظات العميل
              </h2>
              <p className="text-muted">{order.customer_notes}</p>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
              <History className="h-4 w-4 text-brand-600" /> سجل الحالة
            </h2>
            <ul className="space-y-2.5 text-sm">
              {order.order_status_history.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 border-b border-border/50 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <Badge tone={toneFor(ORDER_STATUS_TONE, entry.status)}>{STATUS_LABELS[entry.status] ?? entry.status}</Badge>
                    <span className="text-muted">{new Date(entry.created_at).toLocaleString("ar")}</span>
                  </div>
                  {entry.note && <p className="text-muted">{entry.note}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <User className="h-4 w-4 text-brand-600" /> العميل
            </h2>
            <p className="text-sm text-foreground">{customer?.full_name ?? "—"}</p>
            <p className="text-sm text-muted">{customer?.email}</p>
            <p className="text-sm text-muted">{customer?.phone}</p>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <MapPin className="h-4 w-4 text-brand-600" /> عنوان التوصيل
            </h2>
            <p className="text-sm text-foreground">
              {address.recipient_name} — {address.phone}
            </p>
            <p className="text-sm text-muted">
              {address.governorate} - {address.city} - {address.area}
            </p>
            <p className="text-sm text-muted">{address.detailed_address}</p>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <Clock className="h-4 w-4 text-brand-600" /> ميعاد التوصيل
            </h2>
            <p className="text-sm font-semibold text-foreground">
              {new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString("ar", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-foreground">{slot.label_ar}</p>
            <p className="text-sm text-muted">
              {slot.start_time} - {slot.end_time}
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <Wallet className="h-4 w-4 text-brand-600" /> الدفع
            </h2>
            <Badge tone={toneFor(PAYMENT_STATUS_TONE, order.payment_status)}>{order.payment_status}</Badge>
            {latestPayment && (
              <div className="mt-3">
                {latestPayment.transaction_reference && (
                  <p className="text-sm text-foreground">مرجع العملية: {latestPayment.transaction_reference}</p>
                )}
                {latestPayment.notes && <p className="mt-1 text-sm text-muted">ملاحظة: {latestPayment.notes}</p>}
                <div className="mt-2">
                  <PaymentVerificationControl orderId={order.id} paymentId={latestPayment.id} status={latestPayment.status} />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
