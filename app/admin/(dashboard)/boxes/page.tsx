import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <h1 className="text-2xl font-bold text-foreground">صناديق جرين بوكس</h1>
        <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
          إضافة صندوق جديد
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        الصناديق هي منتجات من نوع &quot;صندوق (Box)&quot; -- أضفها من صفحة المنتجات واختر النوع المناسب.
      </p>

      <div className="mt-6">
        {!boxes || boxes.length === 0 ? (
          <Card className="text-center text-muted">لا توجد صناديق بعد.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {boxes.map((box) => (
              <Card key={box.id}>
                <h3 className="font-semibold text-foreground">{box.name_ar}</h3>
                <p className="text-sm text-muted">{formatPrice(box.price, "ar")}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                    box.is_available ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {box.is_available ? "متاح" : "غير متاح"}
                </span>
                <div className="mt-3 flex gap-3 text-sm">
                  <Link href={`/admin/products/${box.id}/edit`} className="text-brand-700 hover:underline">
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
