"use server";

import { revalidatePath } from "next/cache";
import { adminUpdatePaymentMethod } from "@/lib/services/payments";

export type PaymentMethodActionState = { status: "idle" | "error" | "success"; message?: string };

export async function updatePaymentMethodAction(
  methodId: string,
  _prevState: PaymentMethodActionState,
  formData: FormData,
): Promise<PaymentMethodActionState> {
  const name_ar = String(formData.get("name_ar") ?? "").trim();
  const name_en = String(formData.get("name_en") ?? "").trim();
  const instructions_ar = String(formData.get("instructions_ar") ?? "").trim();
  const instructions_en = String(formData.get("instructions_en") ?? "").trim();
  const walletNumber = String(formData.get("wallet_number") ?? "").trim();
  const is_active = formData.get("is_active") === "on";
  const requires_proof = formData.get("requires_proof") === "on";

  if (!name_ar) return { status: "error", message: "الاسم بالعربي مطلوب" };

  try {
    await adminUpdatePaymentMethod(methodId, {
      name_ar,
      name_en: name_en || null,
      instructions_ar: instructions_ar || null,
      instructions_en: instructions_en || null,
      account_details: walletNumber ? { wallet_number: walletNumber } : {},
      is_active,
      requires_proof,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/payments");
  return { status: "success" };
}
