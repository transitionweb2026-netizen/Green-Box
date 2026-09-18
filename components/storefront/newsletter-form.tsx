"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { subscribeToNewsletterAction, type NewsletterActionState } from "@/app/[locale]/newsletter-actions";

export function NewsletterForm() {
  const t = useTranslations("footer.newsletter");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(subscribeToNewsletterAction, {
    status: "idle",
  } as NewsletterActionState);

  if (state.status === "success") {
    return <p className="text-sm font-semibold text-brand-300">{t("success")}</p>;
  }

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="locale" value={locale} />
      <Input
        type="email"
        name="email"
        required
        placeholder={t("placeholder")}
        className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-brand-400"
      />
      {state.status === "error" && (
        <p className="text-xs font-medium text-danger">{t(state.message === "invalidEmail" ? "invalidEmail" : "genericError")}</p>
      )}
      <button type="submit" disabled={isPending} className={`${buttonVariants({ size: "md" })} w-full`}>
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
