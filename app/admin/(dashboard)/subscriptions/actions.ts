"use server";

import { revalidatePath } from "next/cache";
import {
  adminGenerateSubscriptionOrder,
  adminSetSubscriptionStatus,
  type RenewalResult,
} from "@/lib/services/subscriptions";

export async function adminSetSubscriptionStatusAction(
  subscriptionId: string,
  status: "ACTIVE" | "PAUSED" | "CANCELLED",
) {
  await adminSetSubscriptionStatus(subscriptionId, status);
  revalidatePath(`/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/admin/subscriptions");
}

export async function adminTriggerRenewalAction(subscriptionId: string): Promise<RenewalResult> {
  const result = await adminGenerateSubscriptionOrder(subscriptionId);
  revalidatePath(`/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/admin/orders");
  return result;
}
