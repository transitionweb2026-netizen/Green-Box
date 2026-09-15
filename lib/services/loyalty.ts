import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/types/database";

export type LoyaltyAccount = Tables<"loyalty_accounts">;
export type LoyaltyTransaction = Tables<"loyalty_transactions">;
export type LoyaltySettings = Tables<"loyalty_settings">;

export async function getLoyaltySettings(): Promise<LoyaltySettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("loyalty_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * No loyalty_accounts row exists until a customer's first points-earning
 * order (see DATABASE.md) -- callers should treat null as "0 points, no
 * history yet", not an error.
 */
export async function getMyLoyaltyAccount(): Promise<LoyaltyAccount | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("loyalty_accounts").select("*").eq("profile_id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listMyLoyaltyTransactions(loyaltyAccountId: string): Promise<LoyaltyTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("loyalty_account_id", loyaltyAccountId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// calculateRedemptionValue moved to lib/loyalty/calculations.ts -- it's a
// pure function that a Client Component (the checkout form's live
// redemption preview) needs to call directly, and this file is
// "server-only".

// --- Admin -------------------------------------------------------------

export async function adminUpdateLoyaltySettings(input: TablesUpdate<"loyalty_settings">): Promise<LoyaltySettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("loyalty_settings").update(input).eq("id", 1).select("*").single();
  if (error) throw error;
  return data;
}

export interface AdminLoyaltyAccountRow extends LoyaltyAccount {
  profiles: { full_name: string | null; email: string | null } | null;
}

export interface AdminLoyaltyAccountDetail extends LoyaltyAccount {
  profiles: { full_name: string | null; email: string | null } | null;
}

/**
 * Returns a zero-balance placeholder (not null) when the customer has no
 * loyalty_accounts row yet -- e.g. no points-earning order so far -- so an
 * admin can still open this customer's page and make a first manual
 * adjustment; admin_adjust_loyalty_points() (migration 0020) creates the
 * real row on first use. Returns null only when the profile itself doesn't
 * exist, which the caller treats as 404.
 */
export async function adminGetLoyaltyAccount(profileId: string): Promise<AdminLoyaltyAccountDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_accounts")
    .select("*, profiles(full_name, email)")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as unknown as AdminLoyaltyAccountDetail;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", profileId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  return {
    id: "",
    profile_id: profile.id,
    points_balance: 0,
    pending_points_balance: 0,
    lifetime_points_earned: 0,
    lifetime_points_redeemed: 0,
    updated_at: "",
    profiles: { full_name: profile.full_name, email: profile.email },
  };
}

/**
 * Wraps admin_adjust_loyalty_points() (migration 0020) -- the ADJUSTED
 * transaction type already existed in the schema but had no caller. The
 * function itself enforces admin-only access, a non-empty reason, and
 * rejects any adjustment that would push the balance negative; it also
 * creates the loyalty_accounts row on first use so this works even for a
 * customer with no prior points activity.
 */
export async function adminAdjustLoyaltyPoints(profileId: string, points: number, reason: string): Promise<LoyaltyAccount> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_adjust_loyalty_points", {
    p_profile_id: profileId,
    p_points: points,
    p_reason: reason,
  });
  if (error) throw error;
  return data as unknown as LoyaltyAccount;
}

export interface AdminLoyaltyTransactionRow extends LoyaltyTransaction {
  orders: { order_number: string } | null;
}

/** Same rows as listMyLoyaltyTransactions, with the source order's number
 * embedded so an admin can trace a PENDING/CANCELLED/AVAILABLE transaction
 * back to the order that produced it. */
export async function adminListLoyaltyTransactions(loyaltyAccountId: string): Promise<AdminLoyaltyTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*, orders(order_number)")
    .eq("loyalty_account_id", loyaltyAccountId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as AdminLoyaltyTransactionRow[]) ?? [];
}

export async function adminListLoyaltyAccounts(page = 1, pageSize = 25) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("loyalty_accounts")
    .select("*, profiles(full_name, email)", { count: "exact" })
    .order("points_balance", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { accounts: (data as AdminLoyaltyAccountRow[]) ?? [], total: count ?? 0, page, pageSize };
}
