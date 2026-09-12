import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listMyOrders } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";

export default async function OrdersPage() {
  const t = await getTranslations("orders");
  const tStatus = await getTranslations("orders.status");
  const locale = await getLocale();
  const orders = await listMyOrders();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
      {orders.length === 0 ? (
        <Card className="mt-6 text-center text-muted">{t("empty")}</Card>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.order_number}`}>
              <Card className="hover:border-brand-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {t("orderNumber")}: {order.order_number}
                    </p>
                    <p className="text-sm text-muted">{new Date(order.created_at).toLocaleDateString(locale)}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-brand-700">{formatPrice(order.total, locale)}</p>
                    <p className="text-sm text-muted">{tStatus(order.status)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
