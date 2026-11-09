import "server-only";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// Admin uploads come straight off phone cameras with zero resizing --
// routinely 3000-4000px on the long edge, several MB each, even though the
// largest this site ever actually renders one (a full-bleed hero/banner)
// tops out around 1920-2048px (next.config.ts's images.deviceSizes). Every
// such upload used to get stored byte-for-byte as-is and re-encoded to
// WebP on every cache-miss request by Next's image optimizer instead of
// once up front -- re-encoding a multi-MB original on demand is real,
// measurable latency, and the oversized original still sits in Storage
// forever, so every upload is normalized to a capped, compressed WebP
// here, once, regardless of what format/size came in.
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

/**
 * Uploads to the single public `media` bucket under a folder prefix (see
 * supabase/migrations/0012_storage.sql). Admin-only by RLS on
 * storage.objects; callers must also gate the route/action with
 * requireAdmin() since storage policies are the last line of defense, not
 * the primary one.
 */
export async function uploadMediaFile(folder: "products" | "categories" | "banners" | "recipes", file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("صيغة الملف غير مدعومة. استخدم JPEG أو PNG أو WEBP أو GIF (صور iPhone بصيغة HEIC لازم تتحول لـ JPEG الأول).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("حجم الملف كبير جدًا (الحد الأقصى 5 ميجابايت).");
  }

  const supabase = await createClient();
  const path = `${folder}/${crypto.randomUUID()}.webp`;

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const { error } = await supabase.storage.from("media").upload(path, outputBuffer, {
    contentType: "image/webp",
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
