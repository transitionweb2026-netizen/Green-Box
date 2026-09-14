import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/storefront/auth-shell";
import { LoginForm } from "@/components/storefront/login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const t = await getTranslations("auth.login");
  const { next } = await searchParams;

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <LoginForm next={next} />
    </AuthShell>
  );
}
