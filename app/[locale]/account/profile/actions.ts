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
