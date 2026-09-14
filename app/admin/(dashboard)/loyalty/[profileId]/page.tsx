import { notFound } from "next/navigation";
import Link from "next/link";
import { TrendingDown, TrendingUp, Gift } from "lucide-react";
import { adminGetLoyaltyAccount, listMyLoyaltyTransactions } from "@/lib/services/loyalty";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoyaltyAdjustmentForm } from "@/components/admin/loyalty-adjustment-form";

const TYPE_LABELS: Record<string, string> = {
  EARNED: "نقاط مكتسبة",
  REDEEMED: "نقاط مستخدمة",
  ADJUSTED: "تعديل يدوي",
  REVERSED: "نقاط مُرجعة",
};

export default async function AdminLoyaltyAccountPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  const account = await adminGetLoyaltyAccount(profileId);
  if (!account) notFound();

  const transactions = account.id ? await listMyLoyaltyTransactions(account.id) : [];

  return (
    <div>
      <Link href="/admin/loyalty" className="text-sm font-semibold text-brand-700 hover:underline">
        ← نقاط الولاء
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold text-foreground">
        {account.profiles?.full_name ?? account.profiles?.email}
      </h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-bold text-foreground">تعديل يدوي للرصيد</h2>
            <LoyaltyAdjustmentForm profileId={profileId} />
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-foreground">سجل الحركات</h2>
            {transactions.length === 0 ? (
              <EmptyState icon={<Gift className="h-6 w-6" />} title="لا يوجد سجل حركات بعد." />
            ) : (
              <div className="divide-y divide-border/70">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          tx.points >= 0 ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                        }`}
                      >
                        {tx.points >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                        {tx.reason && <p className="text-xs text-muted">{tx.reason}</p>}
                        <p className="text-xs text-muted-2">{new Date(tx.created_at).toLocaleString("ar")}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className={`font-bold ${tx.points >= 0 ? "text-success" : "text-danger"}`}>
                        {tx.points >= 0 ? "+" : ""}
                        {tx.points}
                      </p>
                      <p className="text-xs text-muted-2">الرصيد بعدها: {tx.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-2 font-bold text-foreground">الرصيد الحالي</h2>
            <p className="text-4xl font-extrabold text-brand-700">{account.points_balance}</p>
          </Card>
          <Card>
            <h2 className="mb-2 font-bold text-foreground">إحصائيات</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">إجمالي المكتسب</span>
                <span className="font-semibold text-foreground">{account.lifetime_points_earned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">إجمالي المستخدم</span>
                <span className="font-semibold text-foreground">{account.lifetime_points_redeemed}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
