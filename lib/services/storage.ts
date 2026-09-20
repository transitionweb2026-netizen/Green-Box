import "server-only";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads to the single public `media` bucket under a folder prefix (see
 * supabase/migrations/0012_storage.sql). Admin-only by RLS on
 * storage.objects; callers must also gate the route/action with
 * requireAdmin() since storage policies are the last line of defense, not
 * the primary one.
 */
export async function uploadMediaFile(folder: "products" | "categories" | "banners" | "recipes", file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type. Use JPEG, PNG, WEBP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File is too large (max 5MB).");
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteMediaFile(publicUrl: string): Promise<void> {
  const supabase = await createClient();
  const marker = "/object/public/media/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from("media").remove([path]);
  if (error) throw error;
}
