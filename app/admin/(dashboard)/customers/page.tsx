import Link from "next/link";
import { adminListCustomers } from "@/lib/services/customers";
import { Card } from "@/components/ui/card";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { customers, total, pageSize } = await adminListCustomers(q, page, 25);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">العملاء</h1>

      <form className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو البريد أو الهاتف..."
          className="h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm"
        />
      </form>

      <div className="mt-4">
        {customers.length === 0 ? (
          <Card className="text-center text-muted">لا يوجد عملاء.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2 text-start">الاسم</th>
                  <th className="px-4 py-2 text-start">البريد الإلكتروني</th>
                  <th className="px-4 py-2 text-start">الهاتف</th>
                  <th className="px-4 py-2 text-start">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-b-0 hover:bg-brand-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/customers/${customer.id}`} className="text-brand-700 hover:underline">
                        {customer.full_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted">{customer.email}</td>
                    <td className="px-4 py-2 text-muted">{customer.phone}</td>
                    <td className="px-4 py-2 text-muted">{new Date(customer.created_at).toLocaleDateString("ar")}</td>
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
