import { getLocale, getTranslations } from "next-intl/server";
import { getLoyaltySettings, getMyLoyaltyAccount, listMyLoyaltyTransactions } from "@/lib/services/loyalty";
import { Card } from "@/components/ui/card";

export default async function LoyaltyPage() {
  const t = await getTranslations("loyalty");
  const locale = await getLocale();

  const settings = await getLoyaltySettings();
  if (!settings || !settings.is_enabled) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        <Card className="mt-6 text-center text-muted">{t("disabled")}</Card>
      </div>
    );
  }

  const account = await getMyLoyaltyAccount();
  const transactions = account ? await listMyLoyaltyTransactions(account.id) : [];

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>

      <Card className="mt-6 text-center">
        <p className="text-sm text-muted">{t("currentBalance")}</p>
        <p className="mt-1 text-4xl font-bold text-brand-700">{account?.points_balance ?? 0}</p>
        <p className="text-sm text-muted">{t("points")}</p>
      </Card>

      <p className="mt-4 text-sm text-muted">{t("howItWorks")}</p>

      <h2 className="mt-8 font-semibold text-foreground">{t("historyTitle")}</h2>
      {transactions.length === 0 ? (
        <Card className="mt-3 text-center text-muted">{t("empty")}</Card>
      ) : (
        <div className="mt-3 divide-y divide-border rounded-xl border border-border">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t(`type.${tx.type}`)}</p>
                <p className="text-xs text-muted">{new Date(tx.created_at).toLocaleDateString(locale)}</p>
              </div>
              <p className={`font-semibold ${tx.points >= 0 ? "text-brand-700" : "text-danger"}`}>
                {tx.points >= 0 ? "+" : ""}
                {tx.points}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
