import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cookie-free anon client, deliberately separate from lib/supabase/server.ts.
 * The regular server client reads cookies() to build a session-aware
 * client, which forces every route that uses it into fully dynamic
 * rendering AND makes it incompatible with unstable_cache (which forbids
 * calling dynamic APIs inside the cached function). Public catalog reads
 * (categories/products/banners) are gated by is_available/is_active, not
 * auth.uid() -- an anonymous, sessionless client returns identical results
 * for them, so this is safe to cache. Never use this for anything
 * personalized (cart, orders, account, admin) -- those still need the real
 * session-aware client in lib/supabase/server.ts.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
