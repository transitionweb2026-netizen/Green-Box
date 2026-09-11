"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { login } from "@/app/[locale]/auth/actions";
import { initialLoginState } from "@/app/[locale]/auth/auth-state";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(login, initialLoginState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.status === "error" && (
        <FormMessage>
          {state.errorCode === "INVALID_CREDENTIALS"
            ? t("errorInvalidCredentials")
            : t("errorGeneric")}
        </FormMessage>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="font-medium text-brand-700 hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
