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
  revalidatePath("/[locale]", "page");
  return { status: "idle" };
}

export async function deleteBannerAction(bannerId: string) {
  await adminDeleteBanner(bannerId);
  revalidatePath("/admin/content");
  revalidatePath("/[locale]", "page");
}

export async function toggleBannerActiveAction(bannerId: string, isActive: boolean) {
  await adminUpdateBanner(bannerId, { is_active: isActive });
  revalidatePath("/admin/content");
  revalidatePath("/[locale]", "page");
}

export type SettingsActionState = { status: "idle" | "error" | "success" };

export async function updateStoreSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const storeNameAr = String(formData.get("store_name_ar") ?? "").trim();
  const storeNameEn = String(formData.get("store_name_en") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const whatsappPhone = String(formData.get("whatsapp_phone") ?? "").trim();
  const deliveryPhone = String(formData.get("delivery_phone") ?? "").trim();
  const socialFacebook = String(formData.get("social_facebook") ?? "").trim();
  const socialInstagram = String(formData.get("social_instagram") ?? "").trim();
  const socialTiktok = String(formData.get("social_tiktok") ?? "").trim();

  try {
    await adminUpsertSetting("store_info", {
      store_name_ar: storeNameAr,
      store_name_en: storeNameEn,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      whatsapp_phone: whatsappPhone,
      delivery_phone: deliveryPhone,
      social_facebook: socialFacebook,
      social_instagram: socialInstagram,
      social_tiktok: socialTiktok,
    });
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/[locale]/contact", "page");
  revalidatePath("/[locale]", "layout");
  return { status: "success" };
}

const homepageContentFields = [
  "greenBoxTitle_ar",
  "greenBoxTitle_en",
  "greenBoxDescription_ar",
  "greenBoxDescription_en",
  "loyaltyTitle_ar",
  "loyaltyTitle_en",
  "loyaltyDescription_ar",
  "loyaltyDescription_en",
  "subscriptionTitle_ar",
  "subscriptionTitle_en",
  "subscriptionDescription_ar",
  "subscriptionDescription_en",
  "finalCtaTitle_ar",
  "finalCtaTitle_en",
  "finalCtaDescription_ar",
  "finalCtaDescription_en",
] as const;

export async function updateHomepageContentAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const value: Record<string, string> = {};
  for (const field of homepageContentFields) {
    value[field] = String(formData.get(field) ?? "").trim();
  }

  try {
    await adminUpsertSetting("homepage_content", value, "Homepage promo section copy -- leave a field empty to use the built-in default text.");
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/[locale]", "page");
  return { status: "success" };
}

export async function updateOrderPolicySettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const cancellationEnabled = formData.get("customer_cancellation_enabled") === "on";
  const cutoffHours = Number(formData.get("cancellation_cutoff_hours") ?? 2);
  if (!Number.isInteger(cutoffHours) || cutoffHours < 0) {
    return { status: "error" };
  }

  try {
    await adminUpsertSetting(
      "order_policy_settings",
      { customer_cancellation_enabled: cancellationEnabled, cancellation_cutoff_hours: cutoffHours },
      "Whether customers can cancel their own order, and how many hours before the delivery slot the cutoff is.",
    );
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  return { status: "success" };
}

const faqContentFields = [
  "question1_ar",
  "question1_en",
  "answer1_ar",
  "answer1_en",
  "question2_ar",
  "question2_en",
  "answer2_ar",
  "answer2_en",
  "question3_ar",
  "question3_en",
  "answer3_ar",
  "answer3_en",
  "ctaLabel_ar",
  "ctaLabel_en",
] as const;

export async function updateFaqContentAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const value: Record<string, string> = {};
  for (const field of faqContentFields) {
    value[field] = String(formData.get(field) ?? "").trim();
  }

  try {
    await adminUpsertSetting("faq_content", value, "Sitewide FAQ teaser shown above the footer -- leave a field empty to use the built-in default text.");
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/[locale]", "layout");
  return { status: "success" };
}

export async function updateTermsContentAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const value = {
    body_ar: String(formData.get("body_ar") ?? "").trim(),
    body_en: String(formData.get("body_en") ?? "").trim(),
  };

  try {
    await adminUpsertSetting("terms_content", value, "Sitewide Terms & Conditions blurb shown above the footer -- leave a field empty to use the built-in placeholder text.");
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/[locale]", "layout");
  return { status: "success" };
}

const pageContentFields = [
  "heading_ar",
  "heading_en",
  "body_ar",
  "body_en",
  "pillar1Title_ar",
  "pillar1Title_en",
  "pillar1Body_ar",
  "pillar1Body_en",
  "pillar2Title_ar",
  "pillar2Title_en",
  "pillar2Body_ar",
  "pillar2Body_en",
  "pillar3Title_ar",
  "pillar3Title_en",
  "pillar3Body_ar",
  "pillar3Body_en",
] as const;

export async function updateOurStoryContentAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const value: Record<string, string> = {};
  for (const field of pageContentFields) {
    value[field] = String(formData.get(field) ?? "").trim();
  }

  try {
    await adminUpsertSetting("our_story_content", value, "The /our-story page's heading, lead paragraph, and three value pillars.");
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/[locale]/our-story", "page");
  return { status: "success" };
}

export async function updateSustainabilityContentAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const value: Record<string, string> = {};
  for (const field of pageContentFields) {
    value[field] = String(formData.get(field) ?? "").trim();
  }

  try {
    await adminUpsertSetting("sustainability_content", value, "The /sustainability page's heading, lead paragraph, and three value pillars.");
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/[locale]/sustainability", "page");
  return { status: "success" };
}

export async function updateReservationSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const leadDays = Number(formData.get("lead_days") ?? 1);
  if (!Number.isInteger(leadDays) || leadDays < 0) {
    return { status: "error" };
  }

  try {
    await adminUpsertSetting(
      "reservation_settings",
      { lead_days: leadDays },
      'Minimum days of advance notice required for products marked "requires reservation".',
    );
  } catch {
    return { status: "error" };
  }

  revalidatePath("/admin/content");
  return { status: "success" };
}
