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
 * Create/view/pause/resume/cancel here is plain data entry the customer
 * controls directly. Renewal and order generation are real and automatic
 * (see migration 0020_subscription_renewal_engine.sql + the daily pg_cron
 * job) -- payment is NOT auto-charged on renewal, that's a deliberate,
 * still-open business decision (see DECISIONS.md), not something left
 * unbuilt by oversight.
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

export interface MySubscriptionDetail extends SubscriptionWithItems {
  addresses: Tables<"addresses"> | null;
  delivery_time_slots: Tables<"delivery_time_slots"> | null;
  payment_methods: Tables<"payment_methods"> | null;
}

/** RLS (subscriptions_owner_all) already scopes this to the caller's own
 * row -- no explicit profile_id filter needed, matching the rest of this
 * codebase's convention for owner-scoped reads. */
export async function getMySubscription(id: string): Promise<MySubscriptionDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "*, subscription_items(*, products(*, product_images(*))), addresses(*), delivery_time_slots(*), payment_methods(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as MySubscriptionDetail | null;
}

export async function listMyOrdersForSubscription(subscriptionId: string): Promise<Tables<"orders">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("delivery_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface CreateSubscriptionInput {
  addressId?: string | null;
  deliveryZoneId?: string | null;
  deliveryTimeSlotId?: string | null;
  paymentMethodId?: string | null;
  dayOfWeek?: number | null;
  items: { productId: string; quantity: number }[];
}

/**
 * Next calendar date (today or later, UTC) that falls on `dayOfWeek`
 * (0 = Sunday ... 6 = Saturday, matching the weekday <select> in
 * subscription-create-form.tsx). Returns today's date if today already
 * matches -- the renewal engine (generate_subscription_orders(), see
 * migration 0020) only ever moves this forward, so a same-day match just
 * means the first delivery can go out as soon as the next cron run picks
 * it up.
 */
function nextDateForWeekday(dayOfWeek: number): string {
  const today = new Date();
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const diff = (dayOfWeek - base.getUTCDay() + 7) % 7;
  base.setUTCDate(base.getUTCDate() + diff);
  return base.toISOString().slice(0, 10);
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
    // Without this, generate_subscription_orders() (migration 0020) would
    // never pick the subscription up at all -- its WHERE clause requires
    // next_delivery_date to be set.
    next_delivery_date: input.dayOfWeek != null ? nextDateForWeekday(input.dayOfWeek) : null,
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

// --- Admin ---------------------------------------------------------------
// Renewal/generation itself lives in trusted DB functions (see migration
// 0020_subscription_renewal_engine.sql: admin_set_subscription_status(),
// admin_generate_subscription_order()) -- subscriptions RLS only grants
// UPDATE to the owning customer, so these RPCs are admin's write path,
// matching the project's existing trusted-function pattern rather than
// widening RLS with a new admin UPDATE policy.

export interface AdminSubscriptionRow extends Subscription {
  profiles: { full_name: string | null; email: string | null } | null;
}

export async function adminListSubscriptions(
  page = 1,
  pageSize = 25,
  status?: "ACTIVE" | "PAUSED" | "CANCELLED",
) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase.from("subscriptions").select("*, profiles(full_name, email)", { count: "exact" });
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return { subscriptions: (data as AdminSubscriptionRow[]) ?? [], total: count ?? 0, page, pageSize };
}

export interface AdminSubscriptionDetail extends SubscriptionWithItems {
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
  addresses: Tables<"addresses"> | null;
  delivery_time_slots: Tables<"delivery_time_slots"> | null;
  payment_methods: Tables<"payment_methods"> | null;
}

export async function adminGetSubscription(id: string): Promise<AdminSubscriptionDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "*, profiles(full_name, email, phone), addresses(*), delivery_time_slots(*), payment_methods(*), subscription_items(*, products(*, product_images(*)))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as AdminSubscriptionDetail | null;
}

export async function adminListOrdersForSubscription(subscriptionId: string): Promise<Tables<"orders">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("delivery_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminSetSubscriptionStatus(
  id: string,
  status: "ACTIVE" | "PAUSED" | "CANCELLED",
): Promise<Subscription> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_subscription_status", {
    p_subscription_id: id,
    p_status: status,
  });
  if (error) throw error;
  return data as unknown as Subscription;
}

export interface RenewalResult {
  order_id: string | null;
  outcome: string;
  reason: string | null;
}

export async function adminGenerateSubscriptionOrder(id: string): Promise<RenewalResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_generate_subscription_order", { p_subscription_id: id });
  if (error) throw error;
  const rows = (data as unknown as RenewalResult[]) ?? [];
  return rows[0] ?? { order_id: null, outcome: "skipped", reason: "No result returned" };
}
