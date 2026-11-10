"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { getSiteOrigin } from "@/lib/seo/site-url";
import type { LoginState, RegisterState, ResetPasswordState } from "./auth-state";

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
    // Supabase gives this one a distinct code -- surfacing it separately
    // means someone who signed up but hasn't clicked the confirmation
    // email yet sees "confirm your email first" instead of the generic
    // "wrong email/password", which reads as a login failure and not what
    // it actually is.
    if (error.code === "email_not_confirmed") {
      return { status: "error", errorCode: "EMAIL_NOT_CONFIRMED" };
    }
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
  const locale = String(formData.get("locale") ?? "ar");
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

  const origin = await getSiteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      },
      // Without this, Supabase falls back to the project's dashboard-level
      // "Site URL" default, which is whatever it was left at (commonly
      // still the localhost default from when the project was created) --
      // confirmed live: confirmation links were sending people to a dead
      // localhost URL. Building it explicitly here, the same way
      // requestPasswordReset below already does, makes it correct
      // regardless of that dashboard setting.
      emailRedirectTo: `${origin}/${locale}/auth/callback?next=${encodeURIComponent(`/${locale}`)}`,
    },
  });

  if (error) {
    return { status: "error", errorCode: "GENERIC" };
  }

  // Supabase's anti-enumeration design: signing up with an email that
  // already has an account returns HTTP 200 with NO error and a
  // plausible-looking (but fabricated) user object, specifically so a
  // caller can't use signUp() to probe which emails are registered. The
  // one reliable tell is an empty identities array -- a genuine new
  // signup always has exactly one. Without this check the form showed
  // "success, check your email" for an already-registered email with
  // nothing actually created, which is exactly what was reported: no new
  // row, nothing in the admin dashboard, and the password just entered
  // not working to log in (because no account was ever created or
  // touched).
  if (!data.user?.identities || data.user.identities.length === 0) {
    return { status: "error", errorCode: "EMAIL_TAKEN" };
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
    if (error.code === "same_password") {
      return { status: "error", errorCode: "SAME_PASSWORD" };
    }
    if (error.code === "weak_password") {
      return { status: "error", errorCode: "WEAK_PASSWORD" };
    }
    return { status: "error", errorCode: "GENERIC" };
  }

  // Deliberately NOT signing out here (an earlier version did, to force a
  // deliberate re-login with the new password) -- confirmed live, via a
  // real browser session, that it broke the success message entirely: a
  // Server Action's response triggers Next.js to re-render the current
  // route's Server Components, so signing out here made
  // reset-password/page.tsx's own getCurrentUser() check (which decides
  // whether to render this form at all vs. its "link invalid" state) find
  // no session anymore and swap to the invalid-link screen, wiping out
  // this very state update before the customer ever saw it -- the
  // password change itself was succeeding the whole time, confirmed via a
  // direct sign-in with the new password while the UI showed an error.
  // Leaving the session intact sidesteps that entirely and is also just a
  // better experience: the customer already typed and confirmed the new
  // password, no reason to make them type it again immediately after.
  return { status: "success" };
}
