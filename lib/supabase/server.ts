import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Per @supabase/ssr's guidance, a new client must be created for
 * each request rather than shared/cached across requests.
 *
 * Note: session-refresh middleware (needed so a long-lived session survives
 * access-token expiry when only read from a plain Server Component) is
 * added in Phase 3 alongside real /admin route protection -- see
 * middleware.ts and TODO.md. Server Actions can still set cookies directly
 * (used by the login/register actions below), so sign-in/sign-up work
 * correctly without it; only long-idle sessions are affected until then.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render, which cannot set
            // cookies (no response to attach them to). Safe to ignore here
            // since Server Actions and Route Handlers -- where auth state
            // actually changes -- can set cookies directly.
          }
        },
      },
    },
  );
}
