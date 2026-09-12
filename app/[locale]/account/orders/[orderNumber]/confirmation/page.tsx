import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOrderByNumber } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const locale = await getLocale();
  const t = await getTranslations("orders");

  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl text-brand-700">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold text-foreground">{t("confirmationTitle")}</h1>
      <p className="mt-2 text-muted">{t("confirmationSubtitle")}</p>

      <Card className="mt-8 text-start">
        <div className="flex justify-between">
          <span className="text-muted">{t("orderNumber")}</span>
          <span className="font-medium text-foreground">{order.order_number}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted">{t("total")}</span>
          <span className="font-medium text-foreground">{formatPrice(order.total, locale)}</span>
        </div>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/account/orders/${order.order_number}`} className={buttonVariants()}>
          {t("viewDetails")}
        </Link>
        <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>
          {t("backToOrders")}
        </Link>
      </div>
    </div>
  );
}
