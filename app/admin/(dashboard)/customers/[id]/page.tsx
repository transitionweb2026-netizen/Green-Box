import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, Sparkles, RefreshCw } from "lucide-react";
import { adminGetCustomerDetail } from "@/lib/services/customers";
import { formatPrice } from "@/lib/i18n/localized";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUS_TONE, toneFor } from "@/lib/ui/status";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await adminGetCustomerDetail(id);
  if (!detail) notFound();

  const { profile, orders, addresses, loyaltyAccount, subscriptions } = detail;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">{profile.full_name ?? profile.email}</h1>
      <p className="text-sm text-muted">
        {profile.email} · {profile.phone}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
            <Package className="h-4 w-4 text-brand-600" /> الطلبات ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد طلبات.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {orders.map((order) => (
                <li key={order.id} className="flex justify-between">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">
                    {order.order_number}
                  </Link>
                  <span className="font-semibold text-deep-700">{formatPrice(order.total, "ar")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
            <MapPin className="h-4 w-4 text-brand-600" /> العناوين ({addresses.length})
          </h2>
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
          <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-brand-600" /> نقاط الولاء
          </h2>
          <p className="text-3xl font-extrabold text-brand-700">{loyaltyAccount?.points_balance ?? 0}</p>
          <Link href={`/admin/loyalty/${profile.id}`} className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline">
            إدارة النقاط وسجل الحركات ←
          </Link>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
            <RefreshCw className="h-4 w-4 text-brand-600" /> الاشتراكات ({subscriptions.length})
          </h2>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد اشتراكات.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {subscriptions.map((sub) => (
                <li key={sub.id}>
                  <Badge tone={toneFor(SUBSCRIPTION_STATUS_TONE, sub.status)}>{sub.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
