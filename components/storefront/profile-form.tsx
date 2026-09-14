"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { updateProfileAction, type ProfileActionState } from "@/app/[locale]/account/profile/actions";
import type { Profile } from "@/lib/auth/session";

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const initialState: ProfileActionState = { status: "idle" };
  const [state, formAction, isPending] = useActionState(updateProfileAction.bind(null, locale), initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
        <Input id="fullName" name="fullName" defaultValue={profile.full_name ?? ""} required minLength={2} />
      </div>
      <div>
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} required minLength={8} />
      </div>
      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" value={profile.email ?? ""} disabled />
      </div>
      {state.status === "success" && <FormMessage variant="success">{t("saved")}</FormMessage>}
      {state.status === "error" && <FormMessage>{t("errorGeneric")}</FormMessage>}
      <Button type="submit" disabled={isPending}>
        {isPending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
