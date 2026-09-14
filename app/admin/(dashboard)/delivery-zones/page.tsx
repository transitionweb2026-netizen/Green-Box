import Link from "next/link";
import { Plus, MapPin } from "lucide-react";
import { adminListZones } from "@/lib/services/delivery";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeactivateButton } from "@/components/admin/deactivate-button";
import { deactivateZoneAction } from "./actions";

export default async function AdminDeliveryZonesPage() {
  const zones = await adminListZones();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">مناطق التوصيل</h1>
        <Link href="/admin/delivery-zones/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة منطقة جديدة
        </Link>
      </div>

      <div className="mt-6">
        {zones.length === 0 ? (
          <EmptyState icon={<MapPin className="h-7 w-7" />} title="لا توجد مناطق توصيل بعد." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <Card key={zone.id} hover>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-foreground">{zone.name_ar}</h3>
                  <Badge tone={zone.is_active ? "success" : "neutral"}>{zone.is_active ? "نشطة" : "معطلة"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted">
                  رسوم التوصيل: {zone.delivery_fee != null ? formatPrice(zone.delivery_fee, "ar") : "لم تُحدد بعد"}
                </p>
                <p className="text-sm text-muted">
                  الحد الأدنى للطلب: {zone.min_order_amount != null ? formatPrice(zone.min_order_amount, "ar") : "لا يوجد"}
                </p>
                <div className="mt-4 flex items-center gap-1 border-t border-border/70 pt-3 text-sm">
                  <Link
                    href={`/admin/delivery-zones/${zone.id}/edit`}
                    className="rounded-lg px-2 py-1 font-semibold text-deep-700 hover:bg-brand-50"
                  >
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
