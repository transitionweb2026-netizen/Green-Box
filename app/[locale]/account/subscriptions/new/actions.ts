"use server";

import { redirect } from "next/navigation";
import { createSubscription } from "@/lib/services/subscriptions";
import { getCartSummary, getOrCreateActiveCart } from "@/lib/services/cart";

export type CreateSubscriptionState = { status: "idle" | "error" };

export async function createSubscriptionFromCartAction(
  locale: string,
  _prevState: CreateSubscriptionState,
  formData: FormData,
): Promise<CreateSubscriptionState> {
  const addressId = String(formData.get("addressId") ?? "");
  const deliveryTimeSlotId = String(formData.get("deliveryTimeSlotId") ?? "");
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const dayOfWeek = formData.get("dayOfWeek");

  if (!addressId || !deliveryTimeSlotId || !paymentMethodId) {
    return { status: "error" };
  }

  const cart = await getOrCreateActiveCart();
  const { items } = await getCartSummary(cart.id);
  if (items.length === 0) return { status: "error" };

  try {
    await createSubscription({
      addressId,
      deliveryTimeSlotId,
      paymentMethodId,
      dayOfWeek: dayOfWeek ? Number(dayOfWeek) : null,
      items: items.map((item) => ({ productId: item.product_id, quantity: item.quantity })),
    });
  } catch {
    return { status: "error" };
  }

  redirect(`/${locale}/account/subscriptions`);
}
