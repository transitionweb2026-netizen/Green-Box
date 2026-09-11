import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="max-w-md text-muted">{t("description")}</p>
      <Link href="/" className={buttonVariants()}>
        {t("backHome")}
      </Link>
    </div>
  );
}
