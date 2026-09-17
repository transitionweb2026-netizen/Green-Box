"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminCreateReview, adminDeleteReview, adminUpdateReview } from "@/lib/services/reviews";

const reviewSchema = z.object({
  customer_name: z.string().trim().min(1).max(150),
  quote_ar: z.string().trim().min(1).max(2000),
  quote_en: z.string().trim().max(2000).optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type ReviewActionState = { status: "idle" | "error"; message?: string };

function parseForm(formData: FormData) {
  return reviewSchema.safeParse({
    customer_name: String(formData.get("customer_name") ?? "").trim(),
    quote_ar: String(formData.get("quote_ar") ?? "").trim(),
    quote_en: String(formData.get("quote_en") ?? "").trim() || undefined,
    rating: formData.get("rating") ?? 5,
    display_order: formData.get("display_order") ?? 0,
    is_active: formData.get("is_active") === "on",
  });
}

export async function createReviewAction(_prevState: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminCreateReview({
      customer_name: parsed.data.customer_name,
      quote_ar: parsed.data.quote_ar,
      quote_en: parsed.data.quote_en ?? null,
      rating: parsed.data.rating,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/reviews");
  revalidateTag("reviews", "max");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/reviews", "page");
  redirect("/admin/reviews");
}

export async function updateReviewAction(
  reviewId: string,
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminUpdateReview(reviewId, {
      customer_name: parsed.data.customer_name,
      quote_ar: parsed.data.quote_ar,
      quote_en: parsed.data.quote_en ?? null,
      rating: parsed.data.rating,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/reviews");
  revalidateTag("reviews", "max");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/reviews", "page");
  redirect("/admin/reviews");
}

export async function deleteReviewAction(reviewId: string) {
  await adminDeleteReview(reviewId);
  revalidatePath("/admin/reviews");
  revalidateTag("reviews", "max");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/reviews", "page");
}
