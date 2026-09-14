"use server";

import { revalidatePath } from "next/cache";
import { adminAdjustLoyaltyPoints } from "@/lib/services/loyalty";

export interface AdjustResult {
  status: "success" | "error";
  message?: string;
  newBalance?: number;
}

export async function adminAdjustLoyaltyPointsAction(
  profileId: string,
  points: number,
  reason: string,
): Promise<AdjustResult> {
  if (!Number.isInteger(points) || points === 0) {
    return { status: "error", message: "أدخل عدد نقاط صحيح غير صفري" };
  }
  if (!reason || !reason.trim()) {
    return { status: "error", message: "السبب مطلوب" };
  }
  try {
    const account = await adminAdjustLoyaltyPoints(profileId, points, reason.trim());
    revalidatePath(`/admin/loyalty/${profileId}`);
    revalidatePath("/admin/loyalty");
    return { status: "success", newBalance: account.points_balance };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }
}
