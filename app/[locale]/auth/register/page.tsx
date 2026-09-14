import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/storefront/auth-shell";
import { RegisterForm } from "@/components/storefront/register-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const t = await getTranslations("auth.register");
  const { next } = await searchParams;

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <RegisterForm next={next} />
    </AuthShell>
  );
}
