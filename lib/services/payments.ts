import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/types/database";

export type PaymentMethod = Tables<"payment_methods">;

export async function listActivePaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

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
  return data;
}
