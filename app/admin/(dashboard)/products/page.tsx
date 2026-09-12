import Link from "next/link";
import { adminListProducts } from "@/lib/services/catalog";
import { formatPrice } from "@/lib/i18n/localized";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
        <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
          إضافة منتج جديد
        </Link>
      </div>

      <form className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو SKU..."
          className="h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm"
        />
      </form>

      <div className="mt-4">
        {products.length === 0 ? (
          <Card className="text-center text-muted">لا توجد منتجات مطابقة.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2 text-start">الاسم</th>
                  <th className="px-4 py-2 text-start">القسم</th>
                  <th className="px-4 py-2 text-start">السعر</th>
                  <th className="px-4 py-2 text-start">الحالة</th>
                  <th className="px-4 py-2 text-start">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-b-0 hover:bg-brand-50">
                    <td className="px-4 py-2">
                      {product.name_ar}
                      {product.product_type === "box" && (
                        <span className="ms-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-800">صندوق</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {(product as { categories?: { name_ar: string } }).categories?.name_ar ?? "—"}
                    </td>
                    <td className="px-4 py-2">{formatPrice(product.price, "ar")}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          product.is_available ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {product.is_available ? "متاح" : "غير متاح"}
                      </span>
                    </td>
                    <td className="flex gap-3 px-4 py-2">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-brand-700 hover:underline">
                        تعديل
                      </Link>
                      {product.is_available && <ArchiveProductButton productId={product.id} productName={product.name_ar} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?page=${p}${q ? `&q=${q}` : ""}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm ${
                  p === page ? "border-brand-600 bg-brand-600 text-white" : "border-border hover:bg-brand-50"
                }`}
              >
                {p}
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
