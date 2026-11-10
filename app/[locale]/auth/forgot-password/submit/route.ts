import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";

/**
 * Triggers the recovery email as a Route Handler (classic form POST, full
 * navigation) instead of a Server Action -- kept this way from an earlier
 * fix attempt, though it no longer matters for THIS step specifically (see
 * below).
 *
 * This no longer sends people to a clickable link at all -- confirmed live
 * that the PKCE code embedded in that link gets silently consumed before
 * the real customer ever clicks it, reproduced identically on two
 * completely different SMTP providers (Brevo, then Gmail), which rules out
 * any provider-side link-wrapping as the cause: something in the email
 * delivery/security-scanning chain (Gmail's own Safe Browsing prefetch is
 * the prime suspect) is pre-fetching the link itself, and Supabase's
 * recovery codes are single-use, so that prefetch's exchange attempt
 * poisons the real one moments later -- "PKCE code verifier not found" is
 * exactly what that produces.
 *
 * Instead this sends people to .../forgot-password/verify to type in the
 * 6-digit OTP code Supabase also issues for every recovery request (see
 * the reset-password email template's {{ .Token }}) -- a scanner that
 * prefetches a URL has no way to read a code out of the email body and
 * submit it through a form, so the code reaching the real customer is
 * still unused when they type it in themselves.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { origin } = request.nextUrl;
  const formData = await request.formData();

  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });

  if (!parsed.success) {
    return NextResponse.redirect(`${origin}/${locale}/auth/forgot-password?error=validation`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

  // Never reveal whether the email exists -- always report success so this
  // can't be used to enumerate registered customers.
  if (error) {
    console.error("resetPasswordForEmail failed:", error.message);
  }
  return NextResponse.redirect(
    `${origin}/${locale}/auth/forgot-password/verify?email=${encodeURIComponent(parsed.data.email)}`,
  );
}
