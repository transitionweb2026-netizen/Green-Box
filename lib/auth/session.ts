import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

/** The current session's user, or null if not signed in. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The current user's profile row (role, name, phone, ...), or null. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

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
