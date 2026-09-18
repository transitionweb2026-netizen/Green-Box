"use server";

import { revalidatePath } from "next/cache";
import { adminDeleteNewsletterSubscriber } from "@/lib/services/newsletter";

export async function deleteNewsletterSubscriberAction(id: string) {
  await adminDeleteNewsletterSubscriber(id);
  revalidatePath("/admin/newsletter");
}
