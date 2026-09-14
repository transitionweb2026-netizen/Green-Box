import Link from "next/link";
import { Search, Users } from "lucide-react";
import { adminListCustomers } from "@/lib/services/customers";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { customers, total, pageSize } = await adminListCustomers(q, page, 25);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">العملاء</h1>
        <p className="text-sm text-muted">{total} عميل</p>
      </div>

      <form className="relative mt-4 max-w-sm">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو البريد أو الهاتف..."
          className="h-10 w-full rounded-xl border border-border bg-white/80 ps-10 pe-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
        />
      </form>

      <div className="mt-5">
        {customers.length === 0 ? (
          <EmptyState icon={<Users className="h-7 w-7" />} title="لا يوجد عملاء." />
        ) : (
          <Card tone="flat" className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-brand-50/50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-start font-semibold">البريد الإلكتروني</th>
                  <th className="px-4 py-3 text-start font-semibold">الهاتف</th>
                  <th className="px-4 py-3 text-start font-semibold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${customer.id}`} className="font-semibold text-brand-700 hover:underline">
                        {customer.full_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{customer.email}</td>
                    <td className="px-4 py-3 text-muted">{customer.phone}</td>
                    <td className="px-4 py-3 text-muted">{new Date(customer.created_at).toLocaleDateString("ar")}</td>
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
