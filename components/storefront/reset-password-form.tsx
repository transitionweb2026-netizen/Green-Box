"use client";

import { useActionState } from "react";
import { CheckCircle2, KeyRound, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updatePassword } from "@/app/[locale]/auth/actions";
import { initialResetPasswordState } from "@/app/[locale]/auth/auth-state";

export function ResetPasswordForm({ linkInvalid }: { linkInvalid?: boolean }) {
  const t = useTranslations("auth.resetPassword");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(updatePassword.bind(null, locale), initialResetPasswordState);

  if (linkInvalid) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-danger-bg px-5 py-8 text-center">
        <TriangleAlert className="h-10 w-10 text-danger" />
        <FormMessage className="mt-0">{t("linkInvalid")}</FormMessage>
        <Link href="/auth/forgot-password" className="mt-2 font-medium text-brand-700 hover:underline">
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-success-bg px-5 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <FormMessage variant="success" className="mt-0">
          {t("successUpdated")}
        </FormMessage>
        <Link href="/auth/login" className="mt-2 font-medium text-brand-700 hover:underline">
          {t("goToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state.status === "error" && state.errorCode === "PASSWORD_MISMATCH" && (
          <FormMessage>{t("errorPasswordMismatch")}</FormMessage>
        )}
      </div>

      {state.status === "error" && state.errorCode !== "PASSWORD_MISMATCH" && <FormMessage>{t("errorGeneric")}</FormMessage>}

      <Button type="submit" disabled={isPending} loading={isPending} className="mt-2 w-full">
        {!isPending && <KeyRound className="h-4 w-4" />}
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
