"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form-message";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { calculateRedemptionValue } from "@/lib/loyalty/calculations";
import { placeOrderAction, type CheckoutActionState } from "@/app/[locale]/checkout/actions";
import type { Address } from "@/lib/services/addresses";
import type { DeliveryTimeSlot } from "@/lib/services/delivery";
import type { PaymentMethod } from "@/lib/services/payments";
// Type-only: erased at compile time, so this does not pull the
// "server-only" lib/services/loyalty.ts module into the client bundle.
import type { LoyaltyAccount, LoyaltySettings } from "@/lib/services/loyalty";

export function CheckoutForm({
  addresses,
  slots,
  paymentMethods,
  loyaltyAccount,
  loyaltySettings,
  subtotal,
}: {
  addresses: Address[];
  slots: DeliveryTimeSlot[];
  paymentMethods: PaymentMethod[];
  loyaltyAccount: LoyaltyAccount | null;
  loyaltySettings: LoyaltySettings | null;
  subtotal: number;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    placeOrderAction.bind(null, locale),
    { status: "idle" } as CheckoutActionState,
  );
  const [redeemPoints, setRedeemPoints] = useState(0);

  const maxRedeemable = loyaltyAccount?.points_balance ?? 0;
  const redemptionValue = loyaltySettings ? calculateRedemptionValue(redeemPoints, loyaltySettings) : 0;

  return (
    <form action={formAction} className="space-y-6">
      <section>
        <h2 className="mb-2 font-semibold text-foreground">{t("addressTitle")}</h2>
        <select name="addressId" required className="h-11 w-full rounded-lg border border-border bg-background px-3">
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.label ? `${address.label} — ` : ""}
              {address.detailed_address}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-foreground">{t("slotTitle")}</h2>
        <select name="deliveryTimeSlotId" required className="h-11 w-full rounded-lg border border-border bg-background px-3">
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {pickLocalized(slot.label_ar, slot.label_en, locale)} ({slot.start_time}-{slot.end_time})
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-foreground">{t("paymentTitle")}</h2>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <label key={method.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <input type="radio" name="paymentMethodId" value={method.id} required className="mt-1" />
              <span>
                <span className="block font-medium text-foreground">{pickLocalized(method.name_ar, method.name_en, locale)}</span>
                {method.instructions_ar && (
                  <span className="block text-sm text-muted">
                    {pickLocalized(method.instructions_ar, method.instructions_en, locale)}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </section>

      {loyaltySettings?.is_enabled && maxRedeemable > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-foreground">{t("loyaltyTitle")}</h2>
          <p className="text-sm text-muted">
            {t("loyaltyAvailable")}: {maxRedeemable}
          </p>
          <Input
            type="number"
            name="redeemPoints"
            min={0}
            max={maxRedeemable}
            value={redeemPoints}
            onChange={(e) => setRedeemPoints(Math.min(maxRedeemable, Math.max(0, Number(e.target.value))))}
            className="mt-2 max-w-[160px]"
          />
          {redeemPoints > 0 && (
            <p className="mt-1 text-sm text-brand-700">
              -{formatPrice(redemptionValue, locale)}
            </p>
          )}
        </section>
      )}

      <section>
        <Label htmlFor="customerNotes">{t("notesTitle")}</Label>
        <textarea
          id="customerNotes"
          name="customerNotes"
          rows={3}
          placeholder={t("notesPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground"
        />
      </section>

      <div className="rounded-xl border border-border p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted">{t("subtotal")}</span>
          <span>{formatPrice(subtotal, locale)}</span>
        </div>
        {redeemPoints > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t("discount")}</span>
            <span>-{formatPrice(redemptionValue, locale)}</span>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          {t("deliveryFee")} {locale === "ar" ? "بيتحدد حسب منطقتك ويظهر بعد تأكيد الطلب" : "is based on your area and shown after you place the order"}
        </p>
      </div>

      {state.status === "error" && <FormMessage>{t("orderFailed")}</FormMessage>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t("placing") : t("placeOrder")}
      </Button>
    </form>
  );
}
