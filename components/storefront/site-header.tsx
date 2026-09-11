import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

export async function SiteHeader() {
  const t = await getTranslations();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-xl font-bold text-brand-700">
          {t("common.siteName")}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/auth/login" className="hover:text-brand-700">
            {t("nav.login")}
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-700"
          >
            {t("nav.register")}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
