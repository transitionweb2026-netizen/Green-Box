"use server";

import { revalidatePath } from "next/cache";
import { adminFindProfileByEmail, adminSetProfileRole } from "@/lib/services/customers";
import type { Profile } from "@/lib/services/customers";

export interface PromoteResult {
  status: "success" | "error";
  message?: string;
  profile?: Profile;
}

export async function adminPromoteByEmailAction(email: string): Promise<PromoteResult> {
  if (!email || !email.trim()) {
    return { status: "error", message: "أدخل البريد الإلكتروني" };
  }
  const profile = await adminFindProfileByEmail(email);
  if (!profile) {
    return { status: "error", message: "لا يوجد مستخدم بهذا البريد الإلكتروني" };
  }
  if (profile.role === "admin") {
    return { status: "error", message: "هذا المستخدم مسؤول بالفعل" };
  }
  try {
    const updated = await adminSetProfileRole(profile.id, "admin");
    revalidatePath("/admin/staff");
    return { status: "success", profile: updated };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }
}

export async function adminDemoteStaffAction(profileId: string): Promise<PromoteResult> {
  try {
    const updated = await adminSetProfileRole(profileId, "customer");
    revalidatePath("/admin/staff");
    return { status: "success", profile: updated };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }
}
