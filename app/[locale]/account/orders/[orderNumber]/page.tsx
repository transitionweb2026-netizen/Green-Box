import { notFound } from "next/navigation";
import { MapPin, Clock, Wallet, StickyNote } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getOrderByNumber, type OrderAddressSnapshot, type OrderSlotSnapshot } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_TONE } from "@/lib/ui/status";
import { OrderTrackingTimeline } from "@/components/storefront/order-tracking-timeline";
import { ReorderButton } from "@/components/storefront/reorder-button";
import { CancelOrderButton } from "@/components/storefront/cancel-order-button";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const locale = await getLocale();
  const t = await getTranslations("orders");
  const tPayStatus = await getTranslations("orders.paymentStatusLabels");

  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const address = order.address_snapshot as unknown as OrderAddressSnapshot;
  const slot = order.delivery_slot_snapshot as unknown as OrderSlotSnapshot;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">
          {t("orderNumber")}: {order.order_number}
        </h1>
        <span className="text-sm text-muted">{new Date(order.created_at).toLocaleString(locale)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <ReorderButton orderId={order.id} />
        {(order.status === "PENDING" || order.status === "CONFIRMED") && (
          <CancelOrderButton orderId={order.id} orderNumber={order.order_number} />
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-5 font-bold text-foreground">{t("trackingTitle")}</h2>
            <OrderTrackingTimeline status={order.status} />
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-foreground">{t("itemsTitle")}</h2>
            <div className="divide-y divide-border/70">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-foreground">{locale === "en" && item.product_name_en ? item.product_name_en : item.product_name_ar}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(item.unit_price, locale)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">{formatPrice(item.line_total, locale)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
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
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-extrabold text-deep-700">
                <span>{t("total")}</span>
                <span>{formatPrice(order.total, locale)}</span>
              </div>
            </div>
          </Card>

          {order.customer_notes && (
            <Card>
              <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
                <StickyNote className="h-4 w-4 text-brand-600" /> {t("notes")}
              </h2>
              <p className="text-muted">{order.customer_notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <MapPin className="h-4 w-4 text-brand-600" /> {t("deliveryAddress")}
            </h2>
            <p className="text-sm text-foreground">
              {address.recipient_name} — {address.phone}
            </p>
            <p className="text-sm text-muted">
              {address.governorate} - {address.city} - {address.area}
            </p>
            <p className="text-sm text-muted">{address.detailed_address}</p>
            {address.landmark && <p className="text-sm text-muted">{address.landmark}</p>}
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <Clock className="h-4 w-4 text-brand-600" /> {t("deliverySlot")}
            </h2>
            <p className="text-sm font-semibold text-foreground">
              {new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString(locale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-foreground">{locale === "en" && slot.label_en ? slot.label_en : slot.label_ar}</p>
            <p className="text-sm text-muted">
              {slot.start_time} - {slot.end_time}
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <Wallet className="h-4 w-4 text-brand-600" /> {t("paymentStatus")}
            </h2>
            <Badge tone={PAYMENT_STATUS_TONE[order.payment_status] ?? "neutral"}>{tPayStatus(order.payment_status)}</Badge>
          </Card>
        </div>
      </div>
    </div>
  );
}
