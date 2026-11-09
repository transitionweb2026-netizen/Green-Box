import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands here after a Supabase auth email link (password recovery or signup
 * confirmation) -- this project's Supabase client is cookie-based
 * (@supabase/ssr), which defaults to the PKCE flow, so the emailed link
 * carries a `?code=` query param rather than an implicit #access_token
 * fragment, and that code has to be exchanged for a real session
 * server-side before anything downstream (e.g. updatePassword in
 * ../actions.ts) has a session to act on.
 *
 * This route didn't exist at all until now even though requestPasswordReset
 * and register (../actions.ts) both already built their redirectTo/
 * emailRedirectTo around this exact path -- every recovery/confirmation
 * link pointed at a route that 404'd, so neither flow could ever complete.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? `/${locale}`;
  // Only ever follow a same-site, locale-prefixed destination -- Supabase
  // just echoes this back unchanged from what we originally embedded in
  // the email, but it's still public input riding in on an incoming
  // request, same reasoning as the `next` check in login() below.
  const next =
    requestedNext.startsWith(`/${locale}/`) || requestedNext === `/${locale}`
      ? requestedNext
      : `/${locale}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed (link already used, or expired) --
  // reset-password's own page already renders a "link invalid, request a
  // new one" state for exactly this via ?error=, see auth/reset-password/page.tsx.
  return NextResponse.redirect(`${origin}/${locale}/auth/reset-password?error=invalid_link`);
}
