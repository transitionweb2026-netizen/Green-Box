"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { changePasswordAction, type ChangePasswordState } from "@/app/[locale]/account/profile/actions";

const initialState: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm() {
  const t = useTranslations("account");
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="password">{t("newPasswordLabel")}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t("confirmNewPasswordLabel")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state.status === "error" && state.errorCode === "PASSWORD_MISMATCH" && (
          <FormMessage>{t("passwordMismatch")}</FormMessage>
        )}
      </div>
      {state.status === "error" && state.errorCode === "SAME_PASSWORD" && (
        <FormMessage>{t("samePassword")}</FormMessage>
      )}
      {state.status === "error" && state.errorCode === "WEAK_PASSWORD" && (
        <FormMessage>{t("weakPassword")}</FormMessage>
      )}
      {state.status === "error" && state.errorCode === "GENERIC" && <FormMessage>{t("errorGeneric")}</FormMessage>}
      {state.status === "success" && <FormMessage variant="success">{t("passwordChanged")}</FormMessage>}
      <Button type="submit" disabled={isPending}>
        {!isPending && <KeyRound className="h-4 w-4" />}
        {isPending ? t("saving") : t("changePassword")}
      </Button>
    </form>
  );
}
