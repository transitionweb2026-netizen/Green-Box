import { Clock, Gift, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getLoyaltySettings, getMyLoyaltyAccount, listMyLoyaltyTransactions } from "@/lib/services/loyalty";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function LoyaltyPage() {
  const t = await getTranslations("loyalty");
  const locale = await getLocale();

  const settings = await getLoyaltySettings();
  if (!settings || !settings.is_enabled) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        <EmptyState className="mt-6" icon={<Gift className="h-7 w-7" />} title={t("disabled")} />
      </div>
    );
  }

  const account = await getMyLoyaltyAccount();
  const transactions = account ? await listMyLoyaltyTransactions(account.id) : [];

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>

      <div className="bg-deep-gradient relative mt-6 overflow-hidden rounded-[var(--radius-card)] p-8 text-center text-white">
        <div className="blob h-48 w-48 bg-brand-500/30 -top-14 -start-10 animate-float-slow" aria-hidden="true" />
        <Sparkles className="relative mx-auto h-8 w-8 text-brand-300" />
        <p className="relative mt-2 text-sm text-white/70">{t("currentBalance")}</p>
        <p className="relative mt-1 text-5xl font-extrabold">{account?.points_balance ?? 0}</p>
        <p className="relative text-sm text-white/70">{t("points")}</p>
      </div>

      {(account?.pending_points_balance ?? 0) > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-white/60 px-4 py-3 text-sm">
          <Clock className="h-4 w-4 shrink-0 text-muted" />
          <span className="text-muted">{t("pendingBalance")}:</span>
          <span className="font-bold text-foreground">{account?.pending_points_balance} {t("points")}</span>
        </div>
      )}

      <p className="mt-4 text-sm text-muted">{t("howItWorks")}</p>
      {(account?.pending_points_balance ?? 0) > 0 && <p className="mt-1 text-sm text-muted">{t("pendingNotice")}</p>}

      <h2 className="mt-8 font-bold text-foreground">{t("historyTitle")}</h2>
      {transactions.length === 0 ? (
        <EmptyState className="mt-3" icon={<Gift className="h-6 w-6" />} title={t("empty")} />
      ) : (
        <Card className="mt-3 divide-y divide-border/70 !p-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    tx.points >= 0 ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                  }`}
                >
                  {tx.points >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">{t(`type.${tx.type}`)}</p>
                    {tx.status === "PENDING" && <Badge tone="warning">{t("status.PENDING")}</Badge>}
                    {tx.status === "CANCELLED" && <Badge tone="danger">{t("status.CANCELLED")}</Badge>}
                  </div>
                  <p className="text-xs text-muted">{new Date(tx.created_at).toLocaleDateString(locale)}</p>
                </div>
              </div>
              <p className={`font-bold ${tx.points >= 0 ? "text-success" : "text-danger"}`}>
                {tx.points >= 0 ? "+" : ""}
                {tx.points}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
