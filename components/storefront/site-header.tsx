import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCountForUser } from "@/lib/services/cart";
import { LocaleSwitcher } from "./locale-switcher";
import { SearchBox } from "./search-box";
import { CartLink } from "./cart-link";

export async function SiteHeader() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const cartCount = user ? await getCartItemCountForUser() : 0;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4">
        <Link href="/" className="text-xl font-bold text-brand-700">
          {t("common.siteName")}
        </Link>

        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:px-4">
          <SearchBox />
        </div>

        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link href="/c" className="hidden hover:text-brand-700 sm:inline">
            {t("nav.categories")}
          </Link>
          <CartLink count={cartCount} label={t("nav.cart")} />
          {user ? (
            <Link href="/account" className="hover:text-brand-700">
              {t("nav.account")}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-brand-700">
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-700"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
