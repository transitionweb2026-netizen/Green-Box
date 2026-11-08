import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables, TablesUpdate } from "@/types/database";

export type PaymentMethod = Tables<"payment_methods">;

/**
 * Cached with the cookie-free public client -- same reasoning as
 * catalog.ts's listActiveCategories. Rendered via SiteFooter on every
 * single storefront page, so this was one of the remaining blockers to
 * static/ISR rendering sitewide, not just a checkout-page concern.
 */
export const listActivePaymentMethods = unstable_cache(
  async (): Promise<PaymentMethod[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  ["payments-active-methods"],
  { revalidate: 60, tags: ["payment_methods"] },
);

// --- Admin -------------------------------------------------------------

export async function adminListPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payment_methods").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminUpdatePaymentMethod(id: string, input: TablesUpdate<"payment_methods">): Promise<PaymentMethod> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payment_methods").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  revalidateTag("payment_methods", "max");
  return data;
}
