import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Integration tests talk to the one real Supabase project this app has --
 * there is no separate staging instance. Every helper here is designed so
 * a test run creates its own throwaway fixtures and tears them down
 * itself, rather than depending on or mutating pre-existing data.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set to run integration tests (see .env.local)`);
  return value;
}

export function serviceClient(): SupabaseClient<Database> {
  return createClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient<Database>;
}

/**
 * Creates a fresh, pre-confirmed customer via the admin API and returns a
 * client already signed in as them, so RLS is exercised exactly as a real
 * request would (auth.uid() resolves from a real session), not spoofed.
 */
export async function createTestUser(admin: SupabaseClient<Database>, label: string): Promise<TestUser> {
  const email = `vitest-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const password = `Test-${Math.random().toString(36).slice(2, 12)}!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Vitest ${label}` },
  });
  if (error || !data.user) throw new Error(`Failed to create test user: ${error?.message}`);

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Failed to sign in as test user: ${signInError.message}`);

  return { id: data.user.id, email, password, client };
}

/** Cascades to profiles/addresses/carts/etc via the profiles_id_fkey ON DELETE CASCADE. */
export async function deleteTestUser(admin: SupabaseClient<Database>, userId: string): Promise<void> {
  await admin.auth.admin.deleteUser(userId);
}
