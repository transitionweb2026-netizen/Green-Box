"use server";

import { revalidatePath } from "next/cache";
import { adminUpdateOrderStatus, adminVerifyPayment } from "@/lib/services/orders";
import type { OrderStatus, PaymentAttemptStatus } from "@/types/database";

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string) {
  await adminUpdateOrderStatus(orderId, status, note);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function verifyPaymentAction(orderId: string, paymentId: string, status: PaymentAttemptStatus, notes?: string) {
  await adminVerifyPayment(paymentId, status, notes);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
