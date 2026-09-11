import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/storefront/login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-foreground">
        {t("title")}
      </h1>
      <p className="mt-2 text-center text-muted">{t("subtitle")}</p>
      <Card className="mt-8">
        <LoginForm />
      </Card>
    </div>
  );
}
