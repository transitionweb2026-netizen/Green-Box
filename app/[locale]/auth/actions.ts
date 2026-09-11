"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import type { LoginState, RegisterState } from "./auth-state";

/**
 * Error codes only -- no translated text. Server Actions cannot use
 * next-intl's locale resolution (it depends on `next/root-params`, which
 * next/root-params itself documents as unsupported in Server Actions), so
 * translation happens in the calling Client Component via useTranslations.
 *
 * State shapes and initial values live in ./auth-state.ts, not here -- a
 * "use server" file may only export async functions.
 */

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const locale = String(formData.get("locale") ?? "ar");

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { status: "error", errorCode: "INVALID_CREDENTIALS" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", errorCode: "INVALID_CREDENTIALS" };
  }

  // Phase 1 has no protected /account area yet (see ROADMAP.md) -- land back
  // on the localized home page for now.
  redirect(`/${locale}`);
}

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (issue) => issue.message === "PASSWORD_MISMATCH",
    );
    return {
      status: "error",
      errorCode: mismatch ? "PASSWORD_MISMATCH" : "VALIDATION",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      },
    },
  });

  if (error) {
    return { status: "error", errorCode: "GENERIC" };
  }

  return { status: "success" };
}
