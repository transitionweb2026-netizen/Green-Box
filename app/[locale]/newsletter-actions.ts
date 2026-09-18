"use server";

import { z } from "zod";
import { subscribeToNewsletter } from "@/lib/services/newsletter";

export type NewsletterActionState = { status: "idle" | "error" | "success"; message?: string };

const emailSchema = z.string().trim().email();

export async function subscribeToNewsletterAction(
  _prevState: NewsletterActionState,
  formData: FormData,
): Promise<NewsletterActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: "invalidEmail" };

  const locale = String(formData.get("locale") ?? "");

  try {
    await subscribeToNewsletter(parsed.data, locale);
  } catch {
    return { status: "error", message: "genericError" };
  }

  return { status: "success" };
}
