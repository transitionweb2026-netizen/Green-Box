"use server";

import { redirect } from "next/navigation";
import { createOrderFromCart } from "@/lib/services/orders";
import { getOrCreateActiveCart } from "@/lib/services/cart";
import { classifyOrderError } from "@/lib/errors/order-errors";

export type CheckoutActionState = { status: "idle" | "error"; message?: string; productName?: string };

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
  const deliveryDate = String(formData.get("deliveryDate") ?? "");
  const customerNotes = String(formData.get("customerNotes") ?? "").trim() || null;
  const redeemPoints = Number(formData.get("redeemPoints") ?? 0) || 0;

  if (!addressId || !deliveryTimeSlotId || !paymentMethodId || !deliveryDate) {
    return { status: "error", message: "SELECT_REQUIRED" };
  }

  // Defense-in-depth only -- create_order() itself is the real boundary
  // (rejects a past date server-side regardless of what the client sends).
  const todayCairo = new Date().toISOString().slice(0, 10);
  if (deliveryDate < todayCairo) {
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
      deliveryDate,
      customerNotes,
      redeemPoints,
    });
  } catch (err) {
    const { code, productName } = classifyOrderError(err instanceof Error ? err.message : undefined);
    return { status: "error", message: code, productName };
  }

  redirect(`/${locale}/account/orders/${order.order_number}/confirmation`);
}
