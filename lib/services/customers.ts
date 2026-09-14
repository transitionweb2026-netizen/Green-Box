import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables, ProfileRole } from "@/types/database";

export type Profile = Tables<"profiles">;

export async function adminListCustomers(search?: string, page = 1, pageSize = 25) {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*", { count: "exact" }).eq("role", "customer");
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { customers: data ?? [], total: count ?? 0, page, pageSize };
}

export interface CustomerDetail {
  profile: Profile;
  orders: Tables<"orders">[];
  addresses: Tables<"addresses">[];
  loyaltyAccount: Tables<"loyalty_accounts"> | null;
  subscriptions: Tables<"subscriptions">[];
}

export async function adminGetCustomerDetail(profileId: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();

  const profileRes = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) return null;

  const [ordersRes, addressesRes, loyaltyRes, subscriptionsRes] = await Promise.all([
    supabase.from("orders").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }),
    supabase.from("addresses").select("*").eq("profile_id", profileId),
    supabase.from("loyalty_accounts").select("*").eq("profile_id", profileId).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("profile_id", profileId),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  if (addressesRes.error) throw addressesRes.error;
  if (loyaltyRes.error) throw loyaltyRes.error;
  if (subscriptionsRes.error) throw subscriptionsRes.error;

  return {
    profile: profileRes.data,
    orders: ordersRes.data ?? [],
    addresses: addressesRes.data ?? [],
    loyaltyAccount: loyaltyRes.data,
    subscriptions: subscriptionsRes.data ?? [],
  };
}

// --- Staff / role management ----------------------------------------------
// Only two roles exist in this project (customer, admin) -- see
// types/database.ts ProfileRole -- so this stays a plain list + promote/
// demote action rather than a general role-management system. The actual
// mutation always goes through admin_set_profile_role() (migration 0020),
// which enforces admin-only access and blocks removing the last admin;
// self-escalation from customer to admin is separately blocked by the
// profiles_prevent_role_self_change trigger (migration 0002).

export async function adminListStaff(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "admin")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminFindProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").ilike("email", email.trim()).maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminSetProfileRole(profileId: string, role: ProfileRole): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_profile_role", {
    p_profile_id: profileId,
    p_new_role: role,
  });
  if (error) throw error;
  return data as unknown as Profile;
}
