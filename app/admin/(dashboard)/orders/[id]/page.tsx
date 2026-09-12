import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
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
      <h1 className="text-2xl font-bold text-foreground">طلب رقم {order.order_number}</h1>
      <p className="text-sm text-muted">{new Date(order.created_at).toLocaleString("ar")}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-foreground">حالة الطلب</h2>
            <p className="mb-3 text-sm text-muted">الحالة الحالية: {STATUS_LABELS[order.status]}</p>
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-foreground">المنتجات</h2>
            <div className="divide-y divide-border">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {item.product_name_ar} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatPrice(item.line_total, "ar")}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
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
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>الإجمالي الكلي</span>
                <span>{formatPrice(order.total, "ar")}</span>
              </div>
            </div>
          </Card>

          {order.customer_notes && (
            <Card>
              <h2 className="mb-2 font-semibold text-foreground">ملاحظات العميل</h2>
              <p className="text-muted">{order.customer_notes}</p>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 font-semibold text-foreground">سجل الحالة</h2>
            <ul className="space-y-2 text-sm">
              {order.order_status_history.map((entry) => (
                <li key={entry.id} className="flex justify-between text-muted">
                  <span>{STATUS_LABELS[entry.status] ?? entry.status}</span>
                  <span>{new Date(entry.created_at).toLocaleString("ar")}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-2 font-semibold text-foreground">العميل</h2>
            <p className="text-sm text-foreground">{customer?.full_name ?? "—"}</p>
            <p className="text-sm text-muted">{customer?.email}</p>
            <p className="text-sm text-muted">{customer?.phone}</p>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-foreground">عنوان التوصيل</h2>
            <p className="text-sm text-foreground">{address.recipient_name} — {address.phone}</p>
            <p className="text-sm text-muted">
              {address.governorate} - {address.city} - {address.area}
            </p>
            <p className="text-sm text-muted">{address.detailed_address}</p>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-foreground">ميعاد التوصيل</h2>
            <p className="text-sm text-foreground">{slot.label_ar}</p>
            <p className="text-sm text-muted">
              {slot.start_time} - {slot.end_time}
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-foreground">الدفع</h2>
            <p className="text-sm text-muted">حالة الطلب: {order.payment_status}</p>
            {latestPayment && (
              <div className="mt-2">
                {latestPayment.transaction_reference && (
                  <p className="text-sm text-foreground">مرجع العملية: {latestPayment.transaction_reference}</p>
                )}
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
