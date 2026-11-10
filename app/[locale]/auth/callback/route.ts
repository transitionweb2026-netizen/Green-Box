import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Lands here after a Supabase signup-confirmation email link -- this
 * project's Supabase client is cookie-based (@supabase/ssr), which
 * defaults to the PKCE flow, so the emailed link carries a `?code=` query
 * param rather than an implicit #access_token fragment, and that code has
 * to be exchanged for a real session server-side.
 *
 * Password recovery no longer comes through here at all -- see
 * auth/forgot-password/submit/route.ts's own comment: the PKCE code in a
 * clickable recovery link was getting silently consumed before the real
 * customer ever clicked it (reproduced identically on two different SMTP
 * providers, so some step in mail delivery/security-scanning is
 * pre-fetching the link), and recovery now uses a typed-in one-time code
 * instead (auth/forgot-password/verify/route.ts), which a URL-prefetcher
 * can't consume since it never reads the email body. Signup confirmation
 * is a single click with no password-entry step riding on it, so it's
 * left on the plain link for now, but it's plausibly exposed to the same
 * class of issue if it ever needs the same treatment.
 *
 * Building the NextResponse first and writing cookies directly onto it
 * (same pattern proxy.ts uses for its own session refresh) is the robust
 * way to persist a session from a Route Handler, vs next/headers'
 * cookies().set(), which has no response object to attach to outside a
 * redirect()/plain return.
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
  }

  // No `code` at all, or the exchange failed (link already used/expired,
  // or consumed by a prefetch) -- nothing to recover from here, so just
  // send them to log in (if the confirmation actually went through
  // already, their next login will succeed; otherwise they'll see why).
  return NextResponse.redirect(`${origin}/${locale}/auth/login`);
}
