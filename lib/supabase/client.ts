import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components. Safe to call repeatedly --
 * @supabase/ssr manages a singleton browser client internally.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
