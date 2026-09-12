import Link from "next/link";
import { adminListZones } from "@/lib/services/delivery";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeactivateButton } from "@/components/admin/deactivate-button";
import { deactivateZoneAction } from "./actions";

export default async function AdminDeliveryZonesPage() {
  const zones = await adminListZones();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">مناطق التوصيل</h1>
        <Link href="/admin/delivery-zones/new" className={buttonVariants({ size: "sm" })}>
          إضافة منطقة جديدة
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.length === 0 ? (
          <Card className="text-center text-muted sm:col-span-2 lg:col-span-3">لا توجد مناطق توصيل بعد.</Card>
        ) : (
          zones.map((zone) => (
            <Card key={zone.id}>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{zone.name_ar}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    zone.is_active ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {zone.is_active ? "نشطة" : "معطلة"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                رسوم التوصيل: {zone.delivery_fee != null ? formatPrice(zone.delivery_fee, "ar") : "لم تُحدد بعد"}
              </p>
              <p className="text-sm text-muted">
                الحد الأدنى للطلب: {zone.min_order_amount != null ? formatPrice(zone.min_order_amount, "ar") : "لا يوجد"}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href={`/admin/delivery-zones/${zone.id}/edit`} className="text-brand-700 hover:underline">
                  تعديل ومناطق التغطية
                </Link>
                {zone.is_active && (
                  <DeactivateButton
                    confirmMessage={`متأكد من تعطيل منطقة "${zone.name_ar}"؟`}
                    action={deactivateZoneAction.bind(null, zone.id)}
                  />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
