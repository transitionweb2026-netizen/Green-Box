"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { pickLocalized } from "@/lib/i18n/localized";
import { createSubscriptionFromCartAction, type CreateSubscriptionState } from "@/app/[locale]/account/subscriptions/new/actions";
import type { Address } from "@/lib/services/addresses";
import type { DeliveryTimeSlot } from "@/lib/services/delivery";
import type { PaymentMethod } from "@/lib/services/payments";
import type { CartItemWithProduct } from "@/lib/services/cart";

const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SubscriptionCreateForm({
  cartItems,
  addresses,
  slots,
  paymentMethods,
}: {
  cartItems: CartItemWithProduct[];
  addresses: Address[];
  slots: DeliveryTimeSlot[];
  paymentMethods: PaymentMethod[];
}) {
  const t = useTranslations("subscriptions");
  const tAddr = useTranslations("addresses");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    createSubscriptionFromCartAction.bind(null, locale),
    { status: "idle" } as CreateSubscriptionState,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <h3 className="mb-2 font-semibold text-foreground">{t("itemsTitle")}</h3>
        <ul className="space-y-1 rounded-lg border border-border p-3 text-sm text-muted">
          {cartItems.map((item) => (
            <li key={item.id}>
              {pickLocalized(item.products.name_ar, item.products.name_en, locale)} × {item.quantity}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Label htmlFor="addressId">{tCheckout("addressTitle")}</Label>
        <select id="addressId" name="addressId" required className="h-11 w-full rounded-lg border border-border bg-background px-3">
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.label || address.detailed_address}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="deliveryTimeSlotId">{tCheckout("slotTitle")}</Label>
        <select
          id="deliveryTimeSlotId"
          name="deliveryTimeSlotId"
          required
          className="h-11 w-full rounded-lg border border-border bg-background px-3"
        >
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {pickLocalized(slot.label_ar, slot.label_en, locale)} ({slot.start_time}-{slot.end_time})
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="dayOfWeek">{locale === "ar" ? "يوم التوصيل الأسبوعي" : "Weekly delivery day"}</Label>
        <select id="dayOfWeek" name="dayOfWeek" required className="h-11 w-full rounded-lg border border-border bg-background px-3">
          {(locale === "ar" ? WEEKDAYS_AR : WEEKDAYS_EN).map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="paymentMethodId">{tCheckout("paymentTitle")}</Label>
        <select
          id="paymentMethodId"
          name="paymentMethodId"
          required
          className="h-11 w-full rounded-lg border border-border bg-background px-3"
        >
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {pickLocalized(method.name_ar, method.name_en, locale)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted">{t("notice")}</p>

      {state.status === "error" && <FormMessage>{tCheckout("orderFailed")}</FormMessage>}

      <Button type="submit" disabled={isPending}>
        {isPending ? tAddr("saving") : t("create")}
      </Button>
    </form>
  );
}
