import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentProfile, requireAuth } from "@/lib/auth/session";
import { getLoyaltySettings, getMyLoyaltyAccount } from "@/lib/services/loyalty";
import { AccountNav } from "@/components/storefront/account-nav";
import { AccountProfileCard } from "@/components/storefront/account-profile-card";

// Explicit per Phase 1 item 4 ("/account/* stays dynamic") -- requireAuth's
// cookies() call already made this dynamic implicitly, but with the rest
// of the app moving to static/ISR this makes it a deliberate choice
// rather than an incidental side effect, for every page under this layout.
export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  await requireAuth(locale, `/${locale}/account`);
  const t = await getTranslations("account.nav");
  const tLoyalty = await getTranslations("loyalty");

  const links = [
    { key: "profile" as const, href: "/account/profile", label: t("profile") },
    { key: "addresses" as const, href: "/account/addresses", label: t("addresses") },
    { key: "orders" as const, href: "/account/orders", label: t("orders") },
    { key: "loyalty" as const, href: "/account/loyalty", label: t("loyalty") },
    { key: "subscriptions" as const, href: "/account/subscriptions", label: t("subscriptions") },
  ];

  const [profile, loyaltySettings] = await Promise.all([getCurrentProfile(), getLoyaltySettings()]);
  const loyaltyAccount = loyaltySettings?.is_enabled ? await getMyLoyaltyAccount() : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-4">
          <AccountProfileCard
            name={profile?.full_name || t("profile")}
            email={profile?.email ?? ""}
            points={loyaltyAccount?.points_balance}
            pointsLabel={tLoyalty("points")}
          />
          <AccountNav links={links} logoutLabel={t("logout")} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
