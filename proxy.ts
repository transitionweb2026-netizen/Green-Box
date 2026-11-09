import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { Database } from "@/types/database";

const intlMiddleware = createMiddleware(routing);

/**
 * Refreshes the Supabase auth session cookies on every matched request.
 *
 * lib/supabase/server.ts's createClient() can only set cookies from a Server
 * Action or Route Handler -- a plain Server Component render throws and that
 * write is silently swallowed (see the comment there). Without this proxy
 * doing the refresh, a request that only ever goes through Server Components
 * (most page loads) never persists a refreshed access token back to the
 * browser. Once the access token expires, Supabase Auth's refresh-token
 * rotation means the next refresh attempt consumes the still-stale cookie's
 * refresh token exactly once and the one after that fails outright, so the
 * request silently falls back to the `anon` role -- which has zero grants on
 * orders/profiles/etc, surfacing as "permission denied for table orders" /
 * "permission denied for table profiles" (confirmed via postgres_logs) and,
 * at checkout, an unclassified GENERIC create_order() failure.
 */
async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Must be getUser(), not getSession() -- getUser() revalidates the token
  // against Supabase Auth and triggers the refresh; getSession() only reads
  // the (possibly stale) local cookie.
  await supabase.auth.getUser();

  return response;
}

// Supabase refresh tokens are single-use/rotating: each getUser()-triggered
// refresh consumes the current one and writes a brand new one to cookies.
// /auth/callback exchanges a one-time recovery/confirmation code for a
// session of its own, and /auth/reset-password both reads that session and
// (via its Server Action, posted back to this same path) updates the
// password with it -- every one of those is a request this proxy also
// matches and used to run its own getUser()-triggered refresh on top of,
// racing the token rotation against the session the route itself was
// trying to establish/use. Confirmed live: this produced exactly the
// intermittent "invalid link" / password-update failures reported, not
// reproducible by calling the same Supabase operations directly outside
// the proxy. These two routes manage their own short-lived session
// directly (see app/[locale]/auth/callback/route.ts and updatePassword in
// ../actions.ts) and don't need -- and are actively harmed by -- the
// general-purpose keep-alive refresh below.
const SENSITIVE_AUTH_FLOW = /\/auth\/(callback|reset-password)(\/|$)/;

/**
 * /admin sits outside next-intl's routing entirely (see i18n/routing.ts),
 * so it only needs the session refresh above; every other route also needs
 * next-intl's locale routing layered on top, with the refreshed cookies
 * carried over onto whichever response next-intl produces.
 */
export default async function proxy(request: NextRequest) {
  if (SENSITIVE_AUTH_FLOW.test(request.nextUrl.pathname)) {
    return intlMiddleware(request);
  }

  const sessionResponse = await refreshSession(request);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    return sessionResponse;
  }

  const intlResponse = intlMiddleware(request);
  for (const cookie of sessionResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie);
  }
  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
