import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Banner = Tables<"banners">;
export type Setting = Tables<"settings">;

export async function listActiveBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSetting<T = Json>(key: string): Promise<T | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return (data?.value as T) ?? null;
}

// --- Admin -------------------------------------------------------------

export async function adminListBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateBanner(input: TablesInsert<"banners">): Promise<Banner> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminUpdateBanner(id: string, input: TablesUpdate<"banners">): Promise<Banner> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function adminDeleteBanner(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

export async function adminUpsertSetting(key: string, value: Json, description?: string): Promise<Setting> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .upsert({ key, value, description }, { onConflict: "key" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function adminListSettings(): Promise<Setting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").order("key", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
