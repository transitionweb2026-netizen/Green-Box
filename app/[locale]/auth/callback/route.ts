import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Lands here after a Supabase auth email link (password recovery or signup
 * confirmation) -- this project's Supabase client is cookie-based
 * (@supabase/ssr), which defaults to the PKCE flow, so the emailed link
 * carries a `?code=` query param rather than an implicit #access_token
 * fragment, and that code has to be exchanged for a real session
 * server-side before anything downstream (e.g. updatePassword in
 * ../actions.ts) has a session to act on.
 *
 * Deliberately NOT using the shared createClient() from lib/supabase/server
 * here -- confirmed live, via a temporary debug readout, that its cookie
 * writes (next/headers' cookies().set(), wrapped in a try/catch that
 * silently swallows failures for the Server Component case) were not
 * reliably landing on this route's redirect response: exchangeCodeForSession
 * reported success, but the following page load had no session at all.
 * Building the NextResponse first and writing cookies directly onto IT
 * (same pattern proxy.ts already uses for its own session refresh) is the
 * robust way to do this from a Route Handler.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams, origin } = request.nextUrl;
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

  // TEMPORARY canary -- isolates whether Set-Cookie on a redirect from this
  // route survives the proxy/CDN pipeline at all, independent of Supabase.
  if (searchParams.get("canary") === "1") {
    const canaryResponse = NextResponse.redirect(`${origin}/${locale}`);
    canaryResponse.cookies.set("callback_canary", "it-worked", { path: "/", maxAge: 300 });
    return canaryResponse;
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    // TEMPORARY -- remove once confirmed fixed live. Surfaces the real
    // exchange failure reason instead of guessing.
    return NextResponse.redirect(
      `${origin}/${locale}/auth/reset-password?error=invalid_link&detail=${encodeURIComponent(`${error.code ?? error.name}: ${error.message}`)}`,
    );
  }

  // No `code` at all -- reset-password's own page already renders a "link
  // invalid, request a new one" state for exactly this via ?error=, see
  // auth/reset-password/page.tsx.
  return NextResponse.redirect(`${origin}/${locale}/auth/reset-password?error=invalid_link&detail=no_code_param`);
}
