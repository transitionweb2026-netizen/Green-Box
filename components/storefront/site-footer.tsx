import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations();

  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted">
      {t("common.siteName")} — {t("footer.rights")} © {new Date().getFullYear()}
    </footer>
  );
}
