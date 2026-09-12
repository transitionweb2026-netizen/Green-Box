"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminCreateBanner, adminDeleteBanner, adminUpdateBanner, adminUpsertSetting } from "@/lib/services/content";
import { uploadMediaFile } from "@/lib/services/storage";

export type BannerActionState = { status: "idle" | "error"; message?: string };

const bannerSchema = z.object({
  title_ar: z.string().trim().max(200).optional(),
  title_en: z.string().trim().max(200).optional(),
  link_url: z.string().trim().url().optional().or(z.literal("")),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function createBannerAction(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const parsed = bannerSchema.safeParse({
    title_ar: String(formData.get("title_ar") ?? "").trim() || undefined,
    title_en: String(formData.get("title_en") ?? "").trim() || undefined,
    link_url: String(formData.get("link_url") ?? "").trim(),
    display_order: formData.get("display_order") ?? 0,
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const file = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (file && file.size > 0) {
    try {
      imageUrl = await uploadMediaFile("banners", file);
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : "فشل رفع الصورة" };
    }
  }

  try {
    await adminCreateBanner({
      title_ar: parsed.data.title_ar ?? null,
      title_en: parsed.data.title_en ?? null,
      link_url: parsed.data.link_url || null,
      image_url: imageUrl,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/content");
  return { status: "idle" };
}

export async function deleteBannerAction(bannerId: string) {
  await adminDeleteBanner(bannerId);
  revalidatePath("/admin/content");
}

export async function toggleBannerActiveAction(bannerId: string, isActive: boolean) {
  await adminUpdateBanner(bannerId, { is_active: isActive });
  revalidatePath("/admin/content");
}

export type SettingsActionState = { status: "idle" | "error" | "success" };

export async function updateStoreSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const storeName = String(formData.get("store_name") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();

  try {
    await adminUpsertSetting("store_info", { store_name: storeName, contact_phone: contactPhone, contact_email: contactEmail });
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  return { status: "success" };
}
