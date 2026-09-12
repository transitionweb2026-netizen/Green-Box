import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getOrderByNumber } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { OrderTrackingTimeline } from "@/components/storefront/order-tracking-timeline";

interface AddressSnapshot {
  label?: string;
  recipient_name: string;
  phone: string;
  governorate: string;
  city: string;
  area: string;
  zone_name_ar?: string;
  zone_name_en?: string;
  detailed_address: string;
  landmark?: string;
}

interface SlotSnapshot {
  label_ar: string;
  label_en?: string;
  start_time: string;
  end_time: string;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const locale = await getLocale();
  const t = await getTranslations("orders");
  const tPayStatus = await getTranslations("orders.paymentStatusLabels");

  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const address = order.address_snapshot as unknown as AddressSnapshot;
  const slot = order.delivery_slot_snapshot as unknown as SlotSnapshot;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          {t("orderNumber")}: {order.order_number}
        </h1>
        <span className="text-sm text-muted">{new Date(order.created_at).toLocaleString(locale)}</span>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-foreground">{t("trackingTitle")}</h2>
            <OrderTrackingTimeline status={order.status} />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-foreground">{t("itemsTitle")}</h2>
            <div className="divide-y divide-border">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-foreground">{locale === "en" && item.product_name_en ? item.product_name_en : item.product_name_ar}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(item.unit_price, locale)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-foreground">{formatPrice(item.line_total, locale)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t("subtotal")}</span>
                <span>{formatPrice(order.subtotal, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("deliveryFee")}</span>
                <span>{formatPrice(order.delivery_fee, locale)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("discount")}</span>
                  <span>-{formatPrice(order.discount_amount, locale)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>{t("total")}</span>
                <span>{formatPrice(order.total, locale)}</span>
              </div>
            </div>
          </Card>

          {order.customer_notes && (
            <Card>
              <h2 className="mb-2 font-semibold text-foreground">{t("notes")}</h2>
              <p className="text-muted">{order.customer_notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-2 font-semibold text-foreground">{t("deliveryAddress")}</h2>
            <p className="text-sm text-foreground">{address.recipient_name} — {address.phone}</p>
            <p className="text-sm text-muted">
              {address.governorate} - {address.city} - {address.area}
            </p>
            <p className="text-sm text-muted">{address.detailed_address}</p>
            {address.landmark && <p className="text-sm text-muted">{address.landmark}</p>}
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-foreground">{t("deliverySlot")}</h2>
            <p className="text-sm text-foreground">
              {locale === "en" && slot.label_en ? slot.label_en : slot.label_ar}
            </p>
            <p className="text-sm text-muted">
              {slot.start_time} - {slot.end_time}
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-foreground">{t("paymentStatus")}</h2>
            <p className="text-sm text-foreground">{tPayStatus(order.payment_status)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
