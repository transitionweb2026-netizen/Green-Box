import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/storefront/auth-shell";
import { ResetPasswordForm } from "@/components/storefront/reset-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("auth.resetPassword");
  return { title: t("title") };
}

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth.resetPassword");
  // Reached only after forgot-password/verify establishes a real session
  // from the emailed one-time code -- if there's no session at all here,
  // the customer navigated straight to this URL without going through
  // that step (or their code never verified), so there's nothing to update.
  const user = await getCurrentUser();

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      {user ? <ResetPasswordForm /> : <ResetPasswordForm linkInvalid />}
    </AuthShell>
  );
}
