import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/storefront/auth-shell";
import { VerifyCodeForm } from "@/components/storefront/verify-code-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.forgotPassword");
  return { title: t("verifyTitle") };
}

export default async function VerifyCodePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const t = await getTranslations("auth.forgotPassword");
  const { email, error } = await searchParams;

  return (
    <AuthShell title={t("verifyTitle")} subtitle={t("verifySubtitle")}>
      <VerifyCodeForm email={email ?? ""} hasError={Boolean(error)} />
    </AuthShell>
  );
}
