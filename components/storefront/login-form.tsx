"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { login } from "@/app/[locale]/auth/actions";
import { initialLoginState } from "@/app/[locale]/auth/auth-state";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(login, initialLoginState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <Link href="/auth/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
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

      <Button type="submit" disabled={isPending} loading={isPending} className="mt-2 w-full">
        {!isPending && <LogIn className="h-4 w-4" />}
        {isPending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link
          href={next ? { pathname: "/auth/register", query: { next } } : "/auth/register"}
          className="font-medium text-brand-700 hover:underline"
        >
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
