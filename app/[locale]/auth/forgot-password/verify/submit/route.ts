import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Verifies the 6-digit recovery code (see forgot-password/submit/route.ts
 * for why this replaced the clickable-link flow) and establishes a real
 * session from it -- same proven pattern as auth/callback/route.ts (build
 * the NextResponse first, write Supabase's cookies directly onto it) since
 * that's the one reliable way to persist cookies from a Route Handler.
 * On success, reset-password already renders its "choose a new password"
 * form for any authenticated visitor, no recovery-link-specific code
 * needed there at all -- verifyOtp's session is a completely normal one.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { origin } = request.nextUrl;
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  const backToVerify = `${origin}/${locale}/auth/forgot-password/verify?email=${encodeURIComponent(email)}`;
  if (!email || !code) {
    return NextResponse.redirect(`${backToVerify}&error=1`);
  }

  const response = NextResponse.redirect(`${origin}/${locale}/auth/reset-password`);
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

  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
  if (error) {
    return NextResponse.redirect(`${backToVerify}&error=1`);
  }
  return response;
}
