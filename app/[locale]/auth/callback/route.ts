import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE code-exchange endpoint for Supabase Auth email links (password
 * recovery today; also correct for a future magic-link/OAuth flow without
 * changes). Supabase's emailed link points here with a `code` query param;
 * exchanging it establishes the real session (a short-lived "recovery"
 * session for the reset-password flow) via cookies, then we redirect to
 * wherever the link was meant to land.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/${locale}/auth/reset-password`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/reset-password?error=invalid_link`);
}
