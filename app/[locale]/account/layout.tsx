import { getLocale, getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/session";
import { AccountNav } from "@/components/storefront/account-nav";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  await requireAuth(locale, `/${locale}/account`);
  const t = await getTranslations("account.nav");

  const links = [
    { key: "profile" as const, href: "/account/profile", label: t("profile") },
    { key: "addresses" as const, href: "/account/addresses", label: t("addresses") },
    { key: "orders" as const, href: "/account/orders", label: t("orders") },
    { key: "loyalty" as const, href: "/account/loyalty", label: t("loyalty") },
    { key: "subscriptions" as const, href: "/account/subscriptions", label: t("subscriptions") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <AccountNav links={links} logoutLabel={t("logout")} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
