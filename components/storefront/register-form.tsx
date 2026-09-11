"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { register } from "@/app/[locale]/auth/actions";
import { initialRegisterState } from "@/app/[locale]/auth/auth-state";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    register,
    initialRegisterState,
  );

  if (state.status === "success") {
    return <FormMessage variant="success">{t("successCheckEmail")}</FormMessage>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required minLength={2} />
      </div>

      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" required minLength={8} />
      </div>

      <div>
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
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

      {state.status === "error" && state.errorCode !== "PASSWORD_MISMATCH" && (
        <FormMessage>{t("errorGeneric")}</FormMessage>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
