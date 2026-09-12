import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAuth } from "@/lib/auth/session";
import { LogoutButton } from "@/components/storefront/logout-button";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  await requireAuth(locale, `/${locale}/account`);
  const t = await getTranslations("account.nav");

  const links = [
    { href: "/account/profile", label: t("profile") },
    { href: "/account/addresses", label: t("addresses") },
    { href: "/account/orders", label: t("orders") },
    { href: "/account/loyalty", label: t("loyalty") },
    { href: "/account/subscriptions", label: t("subscriptions") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-brand-50 md:shrink"
            >
              {link.label}
            </Link>
          ))}
          <LogoutButton label={t("logout")} />
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
