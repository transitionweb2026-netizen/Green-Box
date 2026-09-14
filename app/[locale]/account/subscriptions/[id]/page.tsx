import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Package, RefreshCw, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getMySubscription, listMyOrdersForSubscription } from "@/lib/services/subscriptions";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUS_TONE, ORDER_STATUS_TONE, toneFor } from "@/lib/ui/status";
import { SubscriptionCard } from "@/components/storefront/subscription-card";

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("subscriptions");
  const tCheckout = await getTranslations("checkout");
  const tOrders = await getTranslations("orders");

  const subscription = await getMySubscription(id);
  if (!subscription) notFound();

  const orders = await listMyOrdersForSubscription(id);
  const address = subscription.addresses;
  const slot = subscription.delivery_time_slots;
  const paymentMethod = subscription.payment_methods;

  return (
    <div>
      <Link href="/account/subscriptions" className="text-sm font-semibold text-brand-700 hover:underline">
        {locale === "ar" ? "→" : "←"} {t("title")}
      </Link>

      <div className="mt-4">
        <SubscriptionCard subscription={subscription} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
            <MapPin className="h-4 w-4 text-brand-600" /> {tCheckout("addressTitle")}
          </h2>
          {address ? (
            <>
              <p className="text-sm text-foreground">
                {address.recipient_name} — {address.phone}
              </p>
              <p className="text-sm text-muted">{address.detailed_address}</p>
            </>
          ) : (
            <p className="text-sm text-muted">—</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
            <CalendarDays className="h-4 w-4 text-brand-600" /> {t("deliveryDay")}
          </h2>
          <p className="text-sm font-semibold text-foreground">
            {subscription.day_of_week != null ? t(`weekdays.${WEEKDAY_KEYS[subscription.day_of_week]}`) : "—"}
          </p>
          {slot && (
            <p className="text-sm text-muted">
              {pickLocalized(slot.label_ar, slot.label_en, locale)} ({slot.start_time}-{slot.end_time})
            </p>
          )}
          <p className="mt-2 text-sm text-muted">
            {t("nextDelivery")}: {subscription.next_delivery_date ?? "—"}
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
            <Wallet className="h-4 w-4 text-brand-600" /> {tCheckout("paymentTitle")}
          </h2>
          <p className="text-sm text-foreground">
            {paymentMethod ? pickLocalized(paymentMethod.name_ar, paymentMethod.name_en, locale) : "—"}
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
            <RefreshCw className="h-4 w-4 text-brand-600" /> {t("title")}
          </h2>
          <Badge tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)}>{t(`status.${subscription.status}`)}</Badge>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
          <Package className="h-4 w-4 text-brand-600" /> {tOrders("title")}
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted">{tOrders("empty")}</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/account/orders/${order.order_number}`} className="font-semibold text-brand-700 hover:underline">
                  {order.order_number}
                </Link>
                <span className="text-muted">{order.delivery_date}</span>
                <Badge tone={toneFor(ORDER_STATUS_TONE, order.status)}>{tOrders(`status.${order.status}`)}</Badge>
                <span className="font-semibold text-foreground">{formatPrice(order.total, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
