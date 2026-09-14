"use client";

import { useActionState } from "react";
import { CalendarDays, Check, MapPin, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import { pickLocalized } from "@/lib/i18n/localized";
import { createSubscriptionFromCartAction, type CreateSubscriptionState } from "@/app/[locale]/account/subscriptions/new/actions";
import type { Address } from "@/lib/services/addresses";
import type { DeliveryTimeSlot } from "@/lib/services/delivery";
import type { PaymentMethod } from "@/lib/services/payments";
import type { CartItemWithProduct } from "@/lib/services/cart";

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

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
    <Card tone="glass" className="max-w-lg">
      <form action={formAction} className="space-y-5">
        <div>
          <h3 className="mb-2 font-bold text-foreground">{t("itemsTitle")}</h3>
          <ul className="space-y-1.5">
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-1.5 text-sm text-foreground">
                <span>{pickLocalized(item.products.name_ar, item.products.name_en, locale)}</span>
                <Badge tone="brand">×{item.quantity}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Label htmlFor="addressId" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {tCheckout("addressTitle")}
          </Label>
          <Select id="addressId" name="addressId" required>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label || address.detailed_address}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="deliveryTimeSlotId" className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {tCheckout("slotTitle")}
          </Label>
          <Select id="deliveryTimeSlotId" name="deliveryTimeSlotId" required>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {pickLocalized(slot.label_ar, slot.label_en, locale)} ({slot.start_time}-{slot.end_time})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="dayOfWeek">{t("deliveryDay")}</Label>
          <Select id="dayOfWeek" name="dayOfWeek" required>
            {WEEKDAY_KEYS.map((key, index) => (
              <option key={key} value={index}>
                {t(`weekdays.${key}`)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="paymentMethodId" className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> {tCheckout("paymentTitle")}
          </Label>
          <Select id="paymentMethodId" name="paymentMethodId" required>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {pickLocalized(method.name_ar, method.name_en, locale)}
              </option>
            ))}
          </Select>
        </div>

        <p className="rounded-xl bg-info-bg px-3.5 py-2.5 text-sm text-info">{t("notice")}</p>

        {state.status === "error" && <FormMessage>{t(`errors.${state.message ?? "GENERIC"}`)}</FormMessage>}

        <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
          {!isPending && <Check className="h-4 w-4" />}
          {isPending ? tAddr("saving") : t("create")}
        </Button>
      </form>
    </Card>
  );
}
