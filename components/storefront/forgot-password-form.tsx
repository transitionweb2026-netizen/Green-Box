"use client";

import { Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";

export function ForgotPasswordForm({ hasError }: { hasError?: boolean }) {
  const t = useTranslations("auth.forgotPassword");
  const locale = useLocale();

  return (
    <form action={`/${locale}/auth/forgot-password/submit`} method="post" className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {hasError && <FormMessage>{t("errorGeneric")}</FormMessage>}

      <Button type="submit" className="mt-2 w-full">
        <Mail className="h-4 w-4" />
        {t("submit")}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
