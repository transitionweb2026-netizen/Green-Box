import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOrderByNumber } from "@/lib/services/orders";
import { formatPrice } from "@/lib/i18n/localized";
import { getSetting, type StoreInfo } from "@/lib/services/content";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { buildOrderWhatsAppMessage } from "@/lib/utils/order-whatsapp-message";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const locale = await getLocale();
  const t = await getTranslations("orders");

  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const storeInfo = await getSetting<StoreInfo>("store_info");
  const whatsappLink = storeInfo?.whatsapp_phone
    ? buildWhatsAppLink(storeInfo.whatsapp_phone, buildOrderWhatsAppMessage(order, locale))
    : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="bg-brand-gradient relative mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_16px_32px_-12px_rgba(84,120,41,0.6)]">
        <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
        <span className="blob h-24 w-24 bg-brand-400/30 animate-float-slow" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-foreground">{t("confirmationTitle")}</h1>
      <p className="mt-2 text-muted">{t("confirmationSubtitle")}</p>

      <Card tone="glass" className="mt-8 text-start">
        <div className="flex justify-between">
          <span className="text-muted">{t("orderNumber")}</span>
          <span className="font-semibold text-foreground">{order.order_number}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2">
          <span className="text-muted">{t("total")}</span>
          <span className="font-bold text-deep-700">{formatPrice(order.total, locale)}</span>
        </div>
      </Card>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg", className: "mt-6 w-full gap-2 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10" })}
        >
          <MessageCircle className="h-4 w-4" />
          {t("sendWhatsApp")}
        </a>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/account/orders/${order.order_number}`} className={buttonVariants({ size: "lg" })}>
          {t("viewDetails")}
        </Link>
        <Link href="/account/orders" className={buttonVariants({ variant: "outline", size: "lg" })}>
          {t("backToOrders")}
        </Link>
      </div>
    </div>
  );
}
