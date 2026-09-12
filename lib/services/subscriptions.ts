import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert } from "@/types/database";
import type { ProductWithImages } from "./catalog";

export type Subscription = Tables<"subscriptions">;
export type SubscriptionItem = Tables<"subscription_items">;

export interface SubscriptionWithItems extends Subscription {
  subscription_items: (SubscriptionItem & { products: ProductWithImages })[];
}

/**
 * Data management only -- see DECISIONS.md D10/Q5-Q7 and
 * ARCHITECTURE.md "Subscriptions". Renewal, automatic order generation,
 * and payment-on-renewal are explicitly NOT implemented: the business
 * has not confirmed cadence, payment-collection, or failure-handling
 * rules, and inventing them would violate the project's own "do not
 * invent business rules" constraint. What's implemented here -- create,
 * view, pause, resume, cancel a subscription and its item list -- is safe
 * because it's plain data entry the customer controls directly, not
 * automation with unconfirmed behavior.
 */
export async function listMySubscriptions(): Promise<SubscriptionWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, subscription_items(*, products(*, product_images(*)))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as SubscriptionWithItems[]) ?? [];
}

export async function getMySubscription(id: string): Promise<SubscriptionWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, subscription_items(*, products(*, product_images(*)))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as SubscriptionWithItems | null;
}

export interface CreateSubscriptionInput {
  addressId?: string | null;
  deliveryZoneId?: string | null;
  deliveryTimeSlotId?: string | null;
  paymentMethodId?: string | null;
  dayOfWeek?: number | null;
  items: { productId: string; quantity: number }[];
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const insertPayload: TablesInsert<"subscriptions"> = {
    profile_id: user.id,
    address_id: input.addressId ?? null,
    delivery_zone_id: input.deliveryZoneId ?? null,
    delivery_time_slot_id: input.deliveryTimeSlotId ?? null,
    payment_method_id: input.paymentMethodId ?? null,
    day_of_week: input.dayOfWeek ?? null,
    start_date: new Date().toISOString().slice(0, 10),
  };

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw error;

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from("subscription_items").insert(
      input.items.map((item) => ({
        subscription_id: subscription.id,
        product_id: item.productId,
        quantity: item.quantity,
      })),
    );
    if (itemsError) throw itemsError;
  }

  return subscription;
}

export async function updateSubscriptionStatus(id: string, status: "ACTIVE" | "PAUSED" | "CANCELLED"): Promise<Subscription> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subscriptions").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

// --- Admin (read-only per ARCHITECTURE.md -- no subscription editing rules yet) ---

export interface AdminSubscriptionRow extends Subscription {
  profiles: { full_name: string | null; email: string | null } | null;
}

export async function adminListSubscriptions(page = 1, pageSize = 25) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("subscriptions")
    .select("*, profiles(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { subscriptions: (data as AdminSubscriptionRow[]) ?? [], total: count ?? 0, page, pageSize };
}
