import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listMyOrders } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ORDER_STATUS_TONE } from "@/lib/ui/status";

export default async function OrdersPage() {
  const t = await getTranslations("orders");
  const tStatus = await getTranslations("orders.status");
  const locale = await getLocale();
  const orders = await listMyOrders();
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
      {orders.length === 0 ? (
        <EmptyState className="mt-6" icon={<PackageSearch className="h-7 w-7" />} title={t("empty")} />
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.order_number}`}>
              <Card hover className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {t("orderNumber")}: {order.order_number}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{new Date(order.created_at).toLocaleDateString(locale)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <p className="font-bold text-deep-700">{formatPrice(order.total, locale)}</p>
                    <Badge tone={ORDER_STATUS_TONE[order.status] ?? "neutral"} className="mt-1">
                      {tStatus(order.status)}
                    </Badge>
                  </div>
                  <Chevron className="h-4 w-4 shrink-0 text-muted-2" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
