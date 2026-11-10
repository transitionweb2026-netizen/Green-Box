"use client";

import { KeyRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";

export function VerifyCodeForm({ email, hasError }: { email: string; hasError?: boolean }) {
  const t = useTranslations("auth.forgotPassword");
  const locale = useLocale();

  return (
    <form action={`/${locale}/auth/forgot-password/verify/submit`} method="post" className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />

      <div>
        <Label htmlFor="emailDisplay">{t("emailLabel")}</Label>
        <Input id="emailDisplay" value={email} disabled />
      </div>

      <div>
        <Label htmlFor="code">{t("codeLabel")}</Label>
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="00000000"
          required
          minLength={6}
          maxLength={8}
          className="text-center text-lg tracking-[0.4em]"
        />
      </div>

      {hasError && <FormMessage>{t("codeError")}</FormMessage>}

      <Button type="submit" className="mt-2 w-full">
        <KeyRound className="h-4 w-4" />
        {t("verifySubmit")}
      </Button>
    </form>
  );
}
