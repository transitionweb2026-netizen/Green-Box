import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";

/**
 * Boxes are products with product_type = 'box' (see ARCHITECTURE.md,
 * Green Box Boxes) -- this is a filtered view over the same products
 * table/admin form, not a parallel management system.
 */
export default async function AdminBoxesPage() {
  const supabase = await createClient();
  const { data: boxes } = await supabase
    .from("products")
    .select("*, categories(name_ar)")
    .eq("product_type", "box")
    .order("display_order", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-foreground">صناديق جرين بوكس</h1>
        </div>
        <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة صندوق جديد
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        الصناديق هي منتجات من نوع &quot;صندوق (Box)&quot; -- أضفها من صفحة المنتجات واختر النوع المناسب.
      </p>

      <div className="mt-6">
        {!boxes || boxes.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-7 w-7" />} title="لا توجد صناديق بعد." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {boxes.map((box) => (
              <Card key={box.id} hover>
                <h3 className="font-bold text-foreground">{box.name_ar}</h3>
                <p className="mt-1 font-semibold text-deep-700">{formatPrice(box.price, "ar")}</p>
                <Badge tone={box.is_available ? "success" : "neutral"} className="mt-2">
                  {box.is_available ? "متاح" : "غير متاح"}
                </Badge>
                <div className="mt-4 flex items-center gap-1 border-t border-border/70 pt-3 text-sm">
                  <Link
                    href={`/admin/products/${box.id}/edit`}
                    className="rounded-lg px-2 py-1 font-semibold text-deep-700 hover:bg-brand-50"
                  >
                    تعديل ومحتويات الصندوق
                  </Link>
                  {box.is_available && <ArchiveProductButton productId={box.id} productName={box.name_ar} />}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
