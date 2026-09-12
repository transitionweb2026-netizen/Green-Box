import { notFound } from "next/navigation";
import Link from "next/link";
import { adminGetCustomerDetail } from "@/lib/services/customers";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await adminGetCustomerDetail(id);
  if (!detail) notFound();

  const { profile, orders, addresses, loyaltyAccount, subscriptions } = detail;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{profile.full_name ?? profile.email}</h1>
      <p className="text-sm text-muted">
        {profile.email} · {profile.phone}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-foreground">الطلبات ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد طلبات.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {orders.map((order) => (
                <li key={order.id} className="flex justify-between">
                  <Link href={`/admin/orders/${order.id}`} className="text-brand-700 hover:underline">
                    {order.order_number}
                  </Link>
                  <span>{formatPrice(order.total, "ar")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-foreground">العناوين ({addresses.length})</h2>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد عناوين.</p>
          ) : (
            <ul className="space-y-2 text-sm text-muted">
              {addresses.map((address) => (
                <li key={address.id}>
                  {address.recipient_name} — {address.detailed_address}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-foreground">نقاط الولاء</h2>
          <p className="text-2xl font-bold text-brand-700">{loyaltyAccount?.points_balance ?? 0}</p>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-foreground">الاشتراكات ({subscriptions.length})</h2>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد اشتراكات.</p>
          ) : (
            <ul className="space-y-1 text-sm text-muted">
              {subscriptions.map((sub) => (
                <li key={sub.id}>{sub.status}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
