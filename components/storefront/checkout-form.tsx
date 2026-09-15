"use client";

import { useActionState, useState, type ElementType, type ReactNode } from "react";
import { MapPin, CalendarDays, Clock, Wallet, Gift, StickyNote, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/select";
import { FormMessage } from "@/components/ui/form-message";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { calculateRedemptionValue } from "@/lib/loyalty/calculations";
import { placeOrderAction, type CheckoutActionState } from "@/app/[locale]/checkout/actions";
import type { Address } from "@/lib/services/addresses";
import type { DeliveryTimeSlot } from "@/lib/services/delivery";
import type { PaymentMethod } from "@/lib/services/payments";
// Type-only: erased at compile time, so this does not pull the
// "server-only" lib/services/loyalty.ts module into the client bundle.
import type { LoyaltyAccount, LoyaltySettings } from "@/lib/services/loyalty";

function CheckoutSection({
  icon: Icon,
  title,
  step,
  children,
}: {
  icon: ElementType;
  title: string;
  step: number;
  children: ReactNode;
}) {
  return (
    <Card tone="glass" className="!p-5 sm:!p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">
          {step}
        </span>
        <Icon className="h-4 w-4 text-brand-600" />
        <h2 className="font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

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
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(paymentMethods[0]?.id ?? "");
  const today = new Date().toISOString().slice(0, 10);

  // Available balance only -- loyaltyAccount.points_balance never includes
  // pending points (see lib/services/loyalty.ts), so pending points can
  // never reach this UI as redeemable. Redemption is block-based: the
  // configured redemption_points_unit (e.g. 100) is the only granularity
  // create_order() will accept, so the max offered here is always floored
  // to a whole number of blocks -- 250 available points with a 100-point
  // unit offers exactly 200, never a partial 250.
  const pointsBalance = loyaltyAccount?.points_balance ?? 0;
  const redemptionUnit = loyaltySettings?.redemption_points_unit ?? 0;
  const maxRedeemable = redemptionUnit > 0 ? Math.floor(pointsBalance / redemptionUnit) * redemptionUnit : 0;
  const redeemPoints = useLoyaltyPoints ? maxRedeemable : 0;
  const redemptionValue = loyaltySettings ? calculateRedemptionValue(redeemPoints, loyaltySettings) : 0;
  const maxRedemptionValue = loyaltySettings ? calculateRedemptionValue(maxRedeemable, loyaltySettings) : 0;
  const total = Math.max(0, subtotal - redemptionValue);
  const selectedPayment = paymentMethods.find((m) => m.id === selectedPaymentId);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <CheckoutSection icon={MapPin} title={t("addressTitle")} step={1}>
          <Select name="addressId" required>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label ? `${address.label} — ` : ""}
                {address.detailed_address}
              </option>
            ))}
          </Select>
        </CheckoutSection>

        <CheckoutSection icon={CalendarDays} title={t("dateTitle")} step={2}>
          <Input type="date" name="deliveryDate" required min={today} defaultValue={today} />
        </CheckoutSection>

        <CheckoutSection icon={Clock} title={t("slotTitle")} step={3}>
          <Select name="deliveryTimeSlotId" required>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {pickLocalized(slot.label_ar, slot.label_en, locale)} ({slot.start_time}-{slot.end_time})
              </option>
            ))}
          </Select>
        </CheckoutSection>

        <CheckoutSection icon={Wallet} title={t("paymentTitle")} step={4}>
          <div className="space-y-2.5">
            {paymentMethods.map((method) => {
              const checked = selectedPaymentId === method.id;
              return (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                    checked ? "border-brand-500 bg-brand-50" : "border-border hover:border-border-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethodId"
                    value={method.id}
                    required
                    checked={checked}
                    onChange={() => setSelectedPaymentId(method.id)}
                    className="mt-1 accent-[var(--brand-600)]"
                  />
                  <span>
                    <span className="block font-semibold text-foreground">
                      {pickLocalized(method.name_ar, method.name_en, locale)}
                    </span>
                    {method.instructions_ar && (
                      <span className="mt-0.5 block text-sm text-muted">
                        {pickLocalized(method.instructions_ar, method.instructions_en, locale)}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {selectedPayment?.instructions_ar && (
            <div className="mt-3 rounded-xl bg-info-bg px-3.5 py-2.5 text-sm text-info">
              {t("paymentInstructionsNotice")}
            </div>
          )}
        </CheckoutSection>

        {loyaltySettings?.is_enabled && maxRedeemable > 0 && (
          <CheckoutSection icon={Gift} title={t("loyaltyTitle")} step={5}>
            <p className="text-sm text-muted">{t("loyaltyHave", { points: pointsBalance })}</p>
            <p className="mt-1 text-sm font-semibold text-brand-700">
              {t("loyaltyDiscountAvailable", { amount: formatPrice(maxRedemptionValue, locale) })}
            </p>
            <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-border-strong bg-white/60 px-3.5 py-2.5 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={useLoyaltyPoints}
                onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand-600)]"
              />
              {t("loyaltyRedeem")}
            </label>
            {useLoyaltyPoints && pointsBalance > maxRedeemable && (
              <p className="mt-2 text-xs text-muted">{t("loyaltyRemainingNotice", { remaining: pointsBalance - maxRedeemable })}</p>
            )}
            <input type="hidden" name="redeemPoints" value={redeemPoints} />
          </CheckoutSection>
        )}

        <CheckoutSection icon={StickyNote} title={t("notesTitle")} step={loyaltySettings?.is_enabled && maxRedeemable > 0 ? 6 : 5}>
          <Textarea name="customerNotes" rows={3} placeholder={t("notesPlaceholder")} />
        </CheckoutSection>
      </div>

      <div className="lg:sticky lg:top-24">
        <Card tone="dark" className="!p-6">
          <h3 className="font-bold text-white">{t("reviewTitle")}</h3>
          <div className="mt-4 space-y-2.5 text-sm text-white/80">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span className="font-semibold text-white">{formatPrice(subtotal, locale)}</span>
            </div>
            {redeemPoints > 0 && (
              <div className="flex justify-between text-brand-300">
                <span>{t("discount")}</span>
                <span>-{formatPrice(redemptionValue, locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-white/50">
              <span>{t("deliveryFee")}</span>
              <span>{t("deliveryFeeNotice")}</span>
            </div>
          </div>
          <div className="divider-fade my-4 opacity-20" />
          <div className="flex justify-between text-lg font-extrabold text-white">
            <span>{t("total")}</span>
            <span>{formatPrice(total, locale)}</span>
          </div>

          {state.status === "error" && (
            <FormMessage className="mt-3">
              {t(`errors.${state.message ?? "GENERIC"}`, { product: state.productName ?? "" })}
            </FormMessage>
          )}

          <Button type="submit" disabled={isPending} loading={isPending} className="mt-6 w-full">
            {!isPending && <Check className="h-4 w-4" />}
            {isPending ? t("placing") : t("placeOrder")}
          </Button>
          <p className="mt-3 text-center text-xs text-white/40">{t("nextStepsNotice")}</p>
        </Card>
      </div>
    </form>
  );
}
