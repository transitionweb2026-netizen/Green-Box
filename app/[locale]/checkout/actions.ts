"use server";

import { redirect } from "next/navigation";
import { createOrderFromCart } from "@/lib/services/orders";
import { getOrCreateActiveCart } from "@/lib/services/cart";

export type CheckoutActionState = { status: "idle" | "error"; message?: string };

/**
 * Thin wrapper around create_order() -- see DATABASE.md, Trusted Mutation
 * Functions. Every price/fee/discount here is recomputed server-side by
 * that function; nothing from the client is trusted.
 */
export async function placeOrderAction(
  locale: string,
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const addressId = String(formData.get("addressId") ?? "");
  const deliveryTimeSlotId = String(formData.get("deliveryTimeSlotId") ?? "");
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const customerNotes = String(formData.get("customerNotes") ?? "").trim() || null;
  const redeemPoints = Number(formData.get("redeemPoints") ?? 0) || 0;

  if (!addressId || !deliveryTimeSlotId || !paymentMethodId) {
    return { status: "error", message: "SELECT_REQUIRED" };
  }

  const cart = await getOrCreateActiveCart();

  let order;
  try {
    order = await createOrderFromCart({
      cartId: cart.id,
      addressId,
      deliveryTimeSlotId,
      paymentMethodId,
      customerNotes,
      redeemPoints,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "GENERIC" };
  }

  redirect(`/${locale}/account/orders/${order.order_number}/confirmation`);
}
