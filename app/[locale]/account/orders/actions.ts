"use server";

import { revalidatePath } from "next/cache";
import { cancelMyOrder, reorderFromOrder } from "@/lib/services/orders";
import { classifyCancelOrderError } from "@/lib/errors/order-errors";

export interface ReorderActionResult {
  status: "success" | "error";
  message?: string;
  addedCount?: number;
  unavailableItems?: string[];
}

export async function reorderAction(locale: string, orderId: string): Promise<ReorderActionResult> {
  try {
    const result = await reorderFromOrder(orderId);
    revalidatePath(`/${locale}/cart`);
    return { status: "success", addedCount: result.addedCount, unavailableItems: result.unavailableItems };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "GENERIC" };
  }
}

export interface CancelOrderActionResult {
  status: "success" | "error";
  message?: string;
}

export async function cancelOrderAction(locale: string, orderNumber: string, orderId: string): Promise<CancelOrderActionResult> {
  try {
    await cancelMyOrder(orderId);
  } catch (err) {
    return { status: "error", message: classifyCancelOrderError(err instanceof Error ? err.message : undefined) };
  }
  revalidatePath(`/${locale}/account/orders/${orderNumber}`);
  revalidatePath(`/${locale}/account/orders`);
  return { status: "success" };
}
