"use server";

import { revalidatePath } from "next/cache";
import { adminUpdateLoyaltySettings } from "@/lib/services/loyalty";

export type LoyaltySettingsActionState = { status: "idle" | "error" | "success"; message?: string };

export async function updateLoyaltySettingsAction(
  _prevState: LoyaltySettingsActionState,
  formData: FormData,
): Promise<LoyaltySettingsActionState> {
  const spendThreshold = Number(formData.get("spend_threshold"));
  const pointsPerThreshold = Number(formData.get("points_per_threshold"));
  const redemptionValue = Number(formData.get("points_redemption_value"));
  const redemptionUnit = Number(formData.get("redemption_points_unit"));
  const minRedeemable = String(formData.get("min_redeemable_points") ?? "").trim();
  const isEnabled = formData.get("is_enabled") === "on";

  if ([spendThreshold, pointsPerThreshold, redemptionValue, redemptionUnit].some((n) => !Number.isFinite(n) || n < 0)) {
    return { status: "error", message: "من فضلك أدخل أرقام صحيحة" };
  }

  try {
    await adminUpdateLoyaltySettings({
      is_enabled: isEnabled,
      spend_threshold: spendThreshold,
      points_per_threshold: pointsPerThreshold,
      points_redemption_value: redemptionValue,
      redemption_points_unit: redemptionUnit,
      min_redeemable_points: minRedeemable ? Number(minRedeemable) : null,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/loyalty");
  return { status: "success" };
}
