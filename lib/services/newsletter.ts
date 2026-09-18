import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type NewsletterSubscriber = Tables<"newsletter_subscribers">;

const UNIQUE_VIOLATION = "23505";

/**
 * Public footer signup. Treats an already-subscribed email as success
 * (idempotent) rather than surfacing the unique-constraint error -- both
 * because a returning visitor re-submitting shouldn't see a failure, and
 * so the form can't be used to probe whether a given address is already
 * on the list.
 */
export async function subscribeToNewsletter(email: string, locale: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email, locale });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export async function adminListNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminDeleteNewsletterSubscriber(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) throw error;
}
