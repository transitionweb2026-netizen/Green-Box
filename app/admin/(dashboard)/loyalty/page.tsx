import Link from "next/link";
import { Gift, Users } from "lucide-react";
import { adminListLoyaltyAccounts, getLoyaltySettings } from "@/lib/services/loyalty";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoyaltySettingsForm } from "@/components/admin/loyalty-settings-form";

export default async function AdminLoyaltyPage() {
  const [settings, { accounts }] = await Promise.all([getLoyaltySettings(), adminListLoyaltyAccounts(1, 25)]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Gift className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">نقاط الولاء</h1>
      </div>

      <Card tone="glass" className="mt-6">
        <h2 className="mb-4 font-bold text-foreground">إعدادات البرنامج</h2>
        {settings && <LoyaltySettingsForm settings={settings} />}
      </Card>

      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
        <Users className="h-4 w-4 text-brand-600" /> أرصدة العملاء
      </h2>
      {accounts.length === 0 ? (
        <EmptyState icon={<Gift className="h-7 w-7" />} title="لا يوجد أرصدة نقاط بعد." />
      ) : (
        <Card tone="flat" className="overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-brand-50/50 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العميل</th>
                <th className="px-4 py-3 text-start font-semibold">الرصيد الحالي</th>
                <th className="px-4 py-3 text-start font-semibold">إجمالي المكتسب</th>
                <th className="px-4 py-3 text-start font-semibold">إجمالي المستخدم</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-border/70 last:border-b-0 hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/loyalty/${account.profile_id}`} className="font-semibold text-brand-700 hover:underline">
                      {account.profiles?.full_name ?? account.profiles?.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-700">{account.points_balance}</td>
                  <td className="px-4 py-3 text-muted">{account.lifetime_points_earned}</td>
                  <td className="px-4 py-3 text-muted">{account.lifetime_points_redeemed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
