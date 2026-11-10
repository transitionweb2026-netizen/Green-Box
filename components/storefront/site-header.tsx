import { MessageCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSetting } from "@/lib/services/content";
import type { StoreInfo } from "@/lib/services/content";
import { listActiveCategories, listCategoryMenuProducts } from "@/lib/services/catalog";
import { pickStrictLocalized } from "@/lib/i18n/localized";
import { toWhatsAppDigits } from "@/lib/utils/whatsapp";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { SearchBox } from "./search-box";
import { CartLink } from "./cart-link";
import { MobileNav } from "./mobile-nav";
import { CategoryNavBar } from "./category-nav-bar";
import { PillNav } from "./pill-nav";
import { AccountCartProvider } from "./account-cart-provider";
import { AccountIconLink } from "./account-icon-link";
import { UtilityAccountLinks } from "./utility-account-links";

/**
 * Three visual bands, matching the reference: a thin utility bar (contact +
 * account), a spacious white main row (logo centered, cart/menu at the
 * start, search at the end), and the bold green category bar.
 *
 * Deliberately no getCurrentUser()/cart-count fetch here anymore -- that
 * single cookies() call (SiteHeader renders on every storefront page)
 * used to force every route into fully dynamic rendering. Account/cart
 * state is now fetched client-side after mount via AccountCartProvider,
 * which every page pays for once on mount instead of on every request.
 */
export async function SiteHeader() {
  const t = await getTranslations();
  const [storeInfo, categories, locale] = await Promise.all([
    getSetting<StoreInfo>("store_info"),
    listActiveCategories(),
    getLocale(),
  ]);
  const siteName = pickStrictLocalized(storeInfo?.store_name_ar, storeInfo?.store_name_en, locale, t("common.siteName"));

  const categoryMenus = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: await listCategoryMenuProducts(category.id),
    })),
  );

  const drawerLinks = [
    { href: "/c", label: t("nav.shop") },
    { href: "/box", label: t("nav.greenBox") },
    { href: "/our-story", label: t("nav.ourStory") },
    { href: "/recipes", label: t("nav.recipes") },
    { href: "/sustainability", label: t("nav.sustainability") },
  ];

  const pillLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/c", label: t("nav.shop") },
    { href: "/our-story", label: t("nav.ourStory") },
    { href: "/recipes", label: t("nav.recipes") },
    { href: "/sustainability", label: t("nav.sustainability") },
  ];

  return (
    <AccountCartProvider>
      <header className="sticky top-0 z-40 bg-background">
        <div className="hidden border-b border-border/70 sm:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs text-muted">
            <div>
              {storeInfo?.whatsapp_phone && (
                <a
                  href={`https://wa.me/${toWhatsAppDigits(storeInfo.whatsapp_phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-brand-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {storeInfo.whatsapp_phone}
                </a>
              )}
            </div>
            <div className="flex items-center gap-4">
              <UtilityAccountLinks
                accountLabel={t("nav.account")}
                loginLabel={t("nav.login")}
                registerLabel={t("nav.register")}
              />
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <MobileNav
                links={drawerLinks}
                accountLabel={t("nav.account")}
                loginLabel={t("nav.login")}
                registerLabel={t("nav.register")}
                menuLabel={t("nav.menu")}
              />
              <Link href="/" className="shrink-0">
                <Logo siteName={siteName} />
              </Link>
            </div>

            <div className="flex justify-center">
              <PillNav links={pillLinks} searchLabel={t("nav.search")} />
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="hidden w-full max-w-xs 2xl:block">
                <SearchBox />
              </div>
              <div className="hidden lg:block">
                <LocaleSwitcher />
              </div>
              <AccountIconLink
                loginLabel={t("nav.login")}
                accountLabel={t("nav.account")}
                className="hidden h-10 w-10 items-center justify-center rounded-xl text-deep-700 transition-colors hover:bg-brand-50 lg:flex"
              />
              <span className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
              <CartLink label={t("nav.cart")} />
            </div>
          </div>
          <div className="px-4 pb-3 2xl:hidden">
            <SearchBox />
          </div>
        </div>

        <CategoryNavBar
          categoryMenus={categoryMenus}
          locale={locale}
          greenBoxLabel={t("nav.greenBox")}
          homeLabel={t("nav.home")}
          viewAllLabel={t("nav.viewAll")}
          noItemsLabel={t("nav.noItems")}
        />
      </header>
    </AccountCartProvider>
  );
}
