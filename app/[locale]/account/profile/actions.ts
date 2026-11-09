"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export type ProfileActionState = { status: "idle" | "error" | "success" };

export async function updateProfileAction(
  locale: string,
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const supabase = await createClient();
  // Column-level grant only allows full_name/phone -- see
  // supabase/migrations/0010_privilege_lockdown.sql.
  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
  if (error) return { status: "error" };

  revalidatePath(`/${locale}/account/profile`);
  return { status: "success" };
}

export type ChangePasswordState = {
  status: "idle" | "error" | "success";
  errorCode?: "PASSWORD_MISMATCH" | "SAME_PASSWORD" | "WEAK_PASSWORD" | "GENERIC";
};

// Deliberately separate from the forgot-password/reset-password flow
// (app/[locale]/auth/*) -- this one needs no email link at all, since the
// customer is already authenticated with a normal session. Same
// updateUser() call and error-code mapping as updatePassword() in
// auth/actions.ts, just without any of the PKCE recovery-link machinery.
export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", errorCode: "GENERIC" };

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) {
    return { status: "error", errorCode: "WEAK_PASSWORD" };
  }
  if (password !== confirmPassword) {
    return { status: "error", errorCode: "PASSWORD_MISMATCH" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { status: "error", errorCode: "SAME_PASSWORD" };
    if (error.code === "weak_password") return { status: "error", errorCode: "WEAK_PASSWORD" };
    return { status: "error", errorCode: "GENERIC" };
  }

  return { status: "success" };
}
