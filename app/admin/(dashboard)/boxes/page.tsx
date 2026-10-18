import Link from "next/link";
import { ImageIcon, Plus, Sparkles } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { adminListBoxes } from "@/lib/services/catalog";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ArchiveBoxButton } from "@/components/admin/archive-box-button";

/**
 * Dedicated box management -- previously a thin wrapper that just
 * listed product_type="box" rows and sent "edit" straight into the
 * generic grocery ProductForm (/admin/products/[id]/edit), which also
 * meant the admin nav's "active section" highlighted "المنتجات"
 * (Products) instead of this section while editing a box. Now its own
 * flow end to end: /admin/boxes/new and /admin/boxes/[id]/edit (see
 * components/admin/box-form.tsx for why that form only asks for what a
 * curated box actually needs, not every grocery-product field).
 */
export default async function AdminBoxesPage() {
  const boxes = await adminListBoxes();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-foreground">صناديق جرين بوكس</h1>
        </div>
        <Link href="/admin/boxes/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة صندوق جديد
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        الصناديق اللي بتظهر كبطاقات في الصفحة الرئيسية -- كل صندوق له صورة ووصف ومحتويات خاصة بيه.
      </p>

      <div className="mt-6">
        {boxes.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-7 w-7" />} title="لا توجد صناديق بعد." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {boxes.map((box) => {
              const primaryImage = box.product_images.find((img) => img.is_primary) ?? box.product_images[0];
              return (
                <Card key={box.id} hover className="overflow-hidden !p-0">
                  <div className="relative aspect-[4/3] w-full bg-brand-50">
                    {primaryImage ? (
                      <Image src={primaryImage.url} alt={box.name_ar} fill sizes="320px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-2">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground">{box.name_ar}</h3>
                    <p className="mt-1 font-semibold text-deep-700">{formatPrice(box.price, "ar")}</p>
                    <Badge tone={box.is_available ? "success" : "neutral"} className="mt-2">
                      {box.is_available ? "متاح" : "غير متاح"}
                    </Badge>
                    <div className="mt-4 flex items-center gap-1 border-t border-border/70 pt-3 text-sm">
                      <Link
                        href={`/admin/boxes/${box.id}/edit`}
                        className="rounded-lg px-2 py-1 font-semibold text-deep-700 hover:bg-brand-50"
                      >
                        تعديل الصندوق
                      </Link>
                      {box.is_available && <ArchiveBoxButton boxId={box.id} boxName={box.name_ar} />}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
