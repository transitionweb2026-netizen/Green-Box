import Link from "next/link";
import { Plus, Search, PackageSearch } from "lucide-react";
import { adminListProducts } from "@/lib/services/catalog";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { products, total, pageSize } = await adminListProducts({ search: q, page, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">المنتجات</h1>
          <p className="mt-1 text-sm text-muted">{total} منتج</p>
        </div>
        <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          إضافة منتج جديد
        </Link>
      </div>

      <form className="relative mt-5 max-w-sm">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو SKU..."
          className="h-10 w-full rounded-xl border border-border bg-white/80 ps-10 pe-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
        />
      </form>

      <div className="mt-5">
        {products.length === 0 ? (
          <EmptyState icon={<PackageSearch className="h-7 w-7" />} title="لا توجد منتجات مطابقة." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-start font-semibold">القسم</th>
                  <th className="px-4 py-3 text-start font-semibold">السعر</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {product.name_ar}
                      {product.product_type === "box" && (
                        <Badge tone="deep" className="ms-2">
                          صندوق
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {(product as { categories?: { name_ar: string } }).categories?.name_ar ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-deep-700">{formatPrice(product.price, "ar")}</td>
                    <td className="px-4 py-3">
                      <Badge tone={product.is_available ? "success" : "neutral"}>
                        {product.is_available ? "متاح" : "غير متاح"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg px-2 py-1 text-sm font-semibold text-deep-700 hover:bg-brand-50"
                        >
                          تعديل
                        </Link>
                        {product.is_available && <ArchiveProductButton productId={product.id} productName={product.name_ar} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Pagination page={page} totalPages={totalPages} rtl makeHref={(p) => `?page=${p}${q ? `&q=${q}` : ""}`} />
      </div>
    </div>
  );
}
