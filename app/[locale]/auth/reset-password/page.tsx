import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/storefront/auth-shell";
import { ResetPasswordForm } from "@/components/storefront/reset-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("auth.resetPassword");
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("auth.resetPassword");
  const { error } = await searchParams;
  // The callback route only gets here after successfully exchanging the
  // emailed code for a session -- if there's no session at all, the link
  // was invalid, already used, or expired, so there's nothing to update.
  const user = await getCurrentUser();
  const linkInvalid = Boolean(error) || !user;

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      {linkInvalid ? <ResetPasswordForm linkInvalid /> : <ResetPasswordForm />}
    </AuthShell>
  );
}
