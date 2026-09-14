import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

/**
 * React.cache() dedupes repeated calls within one request/render pass --
 * the header, a layout's requireAuth(), and a page can each ask "who is
 * this?" without turning into that many separate network round-trips to
 * Supabase Auth. Automatically reset between requests by Next.js; never
 * shared across users or requests.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The current user's profile row (role, name, phone, ...), or null. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
});

/**
 * For a Server Component/Action that requires a signed-in customer.
 * Redirects to the localized login page (with a `next` param to return to)
 * rather than throwing, since this runs in page render paths.
 */
export async function requireAuth(locale: string, currentPath?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const next = currentPath ? `?next=${encodeURIComponent(currentPath)}` : "";
    redirect(`/${locale}/auth/login${next}`);
  }
  return user;
}

/**
 * For an /admin Server Component that requires an admin. This is
 * defense-in-depth alongside proxy.ts -- the real authorization boundary
 * is the `is_admin()` RLS policies (see DATABASE.md), so a bug here can
 * never expose another user's data, only produce a wrong redirect.
 */
export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/admin/login");
  }
  return profile;
}
