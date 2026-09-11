import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="rounded-2xl bg-brand-50 px-6 py-16 text-center sm:px-12">
        <h1 className="text-3xl font-bold text-brand-900 sm:text-4xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-800">
          {t("home.heroSubtitle")}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">
          {t("home.categoriesTitle")}
        </h2>
        <Card className="mt-4 text-center text-muted">
          {t("home.categoriesComingSoon")}
        </Card>
      </section>

      <p className="mt-10 text-center text-sm text-muted">
        {t("home.foundationNotice")}
      </p>
    </div>
  );
}
