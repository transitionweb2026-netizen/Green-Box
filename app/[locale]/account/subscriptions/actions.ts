"use server";

import { revalidatePath } from "next/cache";
import { updateSubscriptionStatus } from "@/lib/services/subscriptions";

export async function updateSubscriptionStatusAction(
  locale: string,
  subscriptionId: string,
  status: "ACTIVE" | "PAUSED" | "CANCELLED",
) {
  await updateSubscriptionStatus(subscriptionId, status);
  revalidatePath(`/${locale}/account/subscriptions`);
}
