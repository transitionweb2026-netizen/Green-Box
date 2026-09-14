"use client";

import { useActionState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { register } from "@/app/[locale]/auth/actions";
import { initialRegisterState } from "@/app/[locale]/auth/auth-state";

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth.register");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    register,
    initialRegisterState,
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

      <Button type="submit" disabled={isPending} loading={isPending} className="mt-2 w-full">
        {!isPending && <UserPlus className="h-4 w-4" />}
        {isPending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link
          href={next ? { pathname: "/auth/login", query: { next } } : "/auth/login"}
          className="font-medium text-brand-700 hover:underline"
        >
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
