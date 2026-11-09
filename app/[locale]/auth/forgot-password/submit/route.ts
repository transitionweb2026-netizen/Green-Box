import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { forgotPasswordSchema } from "@/lib/validation/auth";

/**
 * Handles the actual resetPasswordForEmail() call as a Route Handler
 * (classic form POST, full navigation) instead of a Server Action.
 *
 * Confirmed live, via a temporary debug readout on the callback route:
 * the PKCE code_verifier cookies resetPasswordForEmail() writes were not
 * reliably surviving to be read back by /auth/callback when that write
 * happened inside the requestPasswordReset Server Action (lib/supabase/
 * server.ts's createClient(), which can only write cookies through
 * next/headers' cookies() -- there's no response object to attach them to
 * directly from a Server Action that doesn't itself redirect). A canary
 * cookie test proved building the NextResponse first and setting cookies
 * directly on it -- only possible from a Route Handler -- reliably
 * survives the exact same proxy/CDN pipeline, so that's what this route
 * does instead, redirecting back to the forgot-password page with ?sent=1
 * for ForgotPasswordForm to render its "check your email" state.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { origin } = request.nextUrl;
  const formData = await request.formData();

  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });

  const backTo = `${origin}/${locale}/auth/forgot-password`;
  if (!parsed.success) {
    return NextResponse.redirect(`${backTo}?error=validation`);
  }

  const response = NextResponse.redirect(`${backTo}?sent=1`);
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/${locale}/auth/callback?next=${encodeURIComponent(`/${locale}/auth/reset-password`)}`,
  });

  // Never reveal whether the email exists -- always report success so this
  // can't be used to enumerate registered customers.
  if (error) {
    console.error("resetPasswordForEmail failed:", error.message);
  }
  return response;
}
