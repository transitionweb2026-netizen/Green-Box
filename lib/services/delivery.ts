import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type DeliveryZone = Tables<"delivery_zones">;
export type DeliveryArea = Tables<"delivery_areas">;
export type DeliveryTimeSlot = Tables<"delivery_time_slots">;

export async function listActiveTimeSlots(): Promise<DeliveryTimeSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_time_slots")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Areas grouped isn't done here -- the address form groups client-side by governorate/city. */
export async function listActiveAreas(): Promise<(DeliveryArea & { delivery_zones: DeliveryZone })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_areas")
    .select("*, delivery_zones!inner(*)")
    .eq("is_active", true)
    .eq("delivery_zones.is_active", true)
    .order("governorate", { ascending: true })
    .order("city", { ascending: true })
    .order("area", { ascending: true });
  if (error) throw error;
  return (data as (DeliveryArea & { delivery_zones: DeliveryZone })[]) ?? [];
}

export async function getAreaWithZone(areaId: string): Promise<(DeliveryArea & { delivery_zones: DeliveryZone }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_areas")
    .select("*, delivery_zones!inner(*)")
    .eq("id", areaId)
    .maybeSingle();
  if (error) throw error;
  return data as (DeliveryArea & { delivery_zones: DeliveryZone }) | null;
}

// --- Admin: zones ----------------------------------------------------

export async function adminListZones(): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_zones").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateZone(input: TablesInsert<"delivery_zones">): Promise<DeliveryZone> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_zones").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateZone(id: string, input: TablesUpdate<"delivery_zones">): Promise<DeliveryZone> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_zones").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminDeactivateZone(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

// --- Admin: areas ----------------------------------------------------

export async function adminListAreas(): Promise<(DeliveryArea & { delivery_zones: DeliveryZone })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_areas")
    .select("*, delivery_zones(*)")
    .order("governorate", { ascending: true });
  if (error) throw error;
  return (data as (DeliveryArea & { delivery_zones: DeliveryZone })[]) ?? [];
}

export async function adminCreateArea(input: TablesInsert<"delivery_areas">): Promise<DeliveryArea> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_areas").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateArea(id: string, input: TablesUpdate<"delivery_areas">): Promise<DeliveryArea> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_areas").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminDeactivateArea(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_areas").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

// --- Admin: time slots -------------------------------------------------

export async function adminListTimeSlots(): Promise<DeliveryTimeSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_time_slots").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateTimeSlot(input: TablesInsert<"delivery_time_slots">): Promise<DeliveryTimeSlot> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_time_slots").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateTimeSlot(id: string, input: TablesUpdate<"delivery_time_slots">): Promise<DeliveryTimeSlot> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_time_slots").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminDeactivateTimeSlot(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_time_slots").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
