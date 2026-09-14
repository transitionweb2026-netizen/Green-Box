import { CompassIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24">
      <EmptyState
        icon={<CompassIcon className="h-7 w-7" />}
        title={t("title")}
        description={t("description")}
        action={
          <Link href="/" className={buttonVariants()}>
            {t("backHome")}
          </Link>
        }
      />
    </div>
  );
}
