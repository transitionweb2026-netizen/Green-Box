"use client";

import { useActionState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { requestPasswordReset } from "@/app/[locale]/auth/actions";
import { initialForgotPasswordState } from "@/app/[locale]/auth/auth-state";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset.bind(null, locale),
    initialForgotPasswordState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-success-bg px-5 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <FormMessage variant="success" className="mt-0">
          {t("successCheckEmail")}
        </FormMessage>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {state.status === "error" && <FormMessage>{t("errorGeneric")}</FormMessage>}

      <Button type="submit" disabled={isPending} loading={isPending} className="mt-2 w-full">
        {!isPending && <Mail className="h-4 w-4" />}
        {isPending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
