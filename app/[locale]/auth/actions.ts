"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { getSiteOrigin } from "@/lib/seo/site-url";
import type { ForgotPasswordState, LoginState, RegisterState, ResetPasswordState } from "./auth-state";

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
  const next = String(formData.get("next") ?? "");

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

  // Only ever redirect to a same-site, locale-prefixed path -- next comes
  // from a query param an attacker could craft, so anything not matching
  // this shape (e.g. a protocol-relative //evil.com or a bare external
  // URL) falls back to home instead of being followed.
  const isSafeNext = next.startsWith(`/${locale}/`) || next === `/${locale}`;
  redirect(isSafeNext ? next : `/${locale}`);
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

export async function requestPasswordReset(
  locale: string,
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });
  if (!parsed.success) {
    return { status: "error", errorCode: "VALIDATION" };
  }

  const origin = await getSiteOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/${locale}/auth/callback?next=${encodeURIComponent(`/${locale}/auth/reset-password`)}`,
  });

  // Never reveal whether the email exists -- always report success so this
  // can't be used to enumerate registered customers.
  if (error) {
    console.error("resetPasswordForEmail failed:", error.message);
  }
  return { status: "success" };
}

export async function updatePassword(
  locale: string,
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((issue) => issue.message === "PASSWORD_MISMATCH");
    return { status: "error", errorCode: mismatch ? "PASSWORD_MISMATCH" : "VALIDATION" };
  }

  const supabase = await createClient();
  // Requires the recovery session established by /auth/callback -- if that
  // never happened (expired/invalid link), this fails with no session.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", errorCode: "GENERIC" };
  }

  // Recovery sessions are meant to be used once, right after the emailed
  // link -- sign out so the browser returns to a normal logged-out state
  // and the customer logs back in deliberately with their new password.
  await supabase.auth.signOut();
  return { status: "success" };
}
