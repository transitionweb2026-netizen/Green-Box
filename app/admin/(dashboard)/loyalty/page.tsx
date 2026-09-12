import { adminListLoyaltyAccounts, getLoyaltySettings } from "@/lib/services/loyalty";
import { Card } from "@/components/ui/card";
import { LoyaltySettingsForm } from "@/components/admin/loyalty-settings-form";

export default async function AdminLoyaltyPage() {
  const [settings, { accounts }] = await Promise.all([getLoyaltySettings(), adminListLoyaltyAccounts(1, 25)]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">نقاط الولاء</h1>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-foreground">إعدادات البرنامج</h2>
        {settings && <LoyaltySettingsForm settings={settings} />}
      </Card>

      <h2 className="mt-8 mb-3 font-semibold text-foreground">أرصدة العملاء</h2>
      {accounts.length === 0 ? (
        <Card className="text-center text-muted">لا يوجد أرصدة نقاط بعد.</Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-2 text-start">العميل</th>
                <th className="px-4 py-2 text-start">الرصيد الحالي</th>
                <th className="px-4 py-2 text-start">إجمالي المكتسب</th>
                <th className="px-4 py-2 text-start">إجمالي المستخدم</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2">{account.profiles?.full_name ?? account.profiles?.email}</td>
                  <td className="px-4 py-2 font-medium">{account.points_balance}</td>
                  <td className="px-4 py-2 text-muted">{account.lifetime_points_earned}</td>
                  <td className="px-4 py-2 text-muted">{account.lifetime_points_redeemed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
