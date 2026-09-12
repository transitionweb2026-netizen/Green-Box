import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert } from "@/types/database";

export type Address = Tables<"addresses">;
export type AddressInsert = TablesInsert<"addresses">;

/** RLS scopes this to the caller's own rows -- see DATABASE.md, addresses. */
export async function listMyAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyAddress(id: string): Promise<Address | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("addresses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAddress(input: Omit<AddressInsert, "profile_id">): Promise<Address> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...input, profile_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAddress(id: string, input: Partial<AddressInsert>): Promise<Address> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("addresses").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultAddress(id: string): Promise<void> {
  // The addresses_enforce_single_default trigger unsets any other default
  // for this profile -- see DATABASE.md, addresses.
  const supabase = await createClient();
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  if (error) throw error;
}
