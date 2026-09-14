import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/storefront/auth-shell";
import { ForgotPasswordForm } from "@/components/storefront/forgot-password-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.forgotPassword");
  return { title: t("title") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
