import { LogIn, User, LayoutGrid, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCountForUser } from "@/lib/services/cart";
import { getSetting } from "@/lib/services/content";
import type { StoreInfo } from "@/lib/services/content";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { SearchBox } from "./search-box";
import { CartLink } from "./cart-link";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const t = await getTranslations();
  const [user, storeInfo] = await Promise.all([getCurrentUser(), getSetting<StoreInfo>("store_info")]);
  const cartCount = user ? await getCartItemCountForUser() : 0;
  const siteName = storeInfo?.store_name || t("common.siteName");

  const navLinks = [
    { href: "/c", label: t("nav.categories"), icon: LayoutGrid },
    { href: "/box", label: t("nav.greenBox"), icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-3 px-4 py-3 sm:h-20">
        <MobileNav
          links={navLinks.map((l) => ({ href: l.href, label: l.label }))}
          isLoggedIn={!!user}
          accountLabel={t("nav.account")}
          loginLabel={t("nav.login")}
          registerLabel={t("nav.register")}
          menuLabel={t("nav.menu")}
        />

        <Link href="/" className="shrink-0">
          <Logo siteName={siteName} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-deep-700/80 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mx-1 hidden flex-1 sm:block">
          <SearchBox />
        </div>

        <div className="ms-auto flex items-center gap-2">
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>
          <CartLink count={cartCount} label={t("nav.cart")} />
          {user ? (
            <Link
              href="/account"
              className="hidden h-10 items-center gap-1.5 rounded-xl border border-border-strong bg-white/70 px-3 text-sm font-semibold text-deep-700 transition-colors hover:border-brand-400 hover:bg-brand-50 sm:flex"
            >
              <User className="h-4 w-4" />
              {t("nav.account")}
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/auth/login"
                className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-deep-700 transition-colors hover:bg-brand-50"
              >
                <LogIn className="h-4 w-4" />
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/register"
                className="bg-brand-gradient flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(84,120,41,0.6)] transition-transform hover:-translate-y-0.5"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/40 px-4 pb-3 sm:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
