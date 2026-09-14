"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminCreateTimeSlot, adminDeactivateTimeSlot, adminUpdateTimeSlot } from "@/lib/services/delivery";

const slotSchema = z
  .object({
    label_ar: z.string().trim().min(1).max(100),
    label_en: z.string().trim().max(100).optional(),
    start_time: z.string().trim().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().trim().regex(/^\d{2}:\d{2}$/),
    display_order: z.coerce.number().int().default(0),
    max_orders: z.coerce.number().int().positive().optional(),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.end_time > data.start_time, { message: "وقت النهاية لازم يكون بعد وقت البداية", path: ["end_time"] });

export type SlotActionState = { status: "idle" | "error"; message?: string };

function parseForm(formData: FormData) {
  return slotSchema.safeParse({
    label_ar: String(formData.get("label_ar") ?? "").trim(),
    label_en: String(formData.get("label_en") ?? "").trim() || undefined,
    start_time: String(formData.get("start_time") ?? "").trim(),
    end_time: String(formData.get("end_time") ?? "").trim(),
    display_order: formData.get("display_order") ?? 0,
    max_orders: String(formData.get("max_orders") ?? "").trim() || undefined,
    is_active: formData.get("is_active") === "on",
  });
}

export async function createSlotAction(_prevState: SlotActionState, formData: FormData): Promise<SlotActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminCreateTimeSlot({
      label_ar: parsed.data.label_ar,
      label_en: parsed.data.label_en ?? null,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      display_order: parsed.data.display_order,
      max_orders: parsed.data.max_orders ?? null,
      is_active: parsed.data.is_active,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/delivery-slots");
  redirect("/admin/delivery-slots");
}

export async function updateSlotAction(
  slotId: string,
  _prevState: SlotActionState,
  formData: FormData,
): Promise<SlotActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminUpdateTimeSlot(slotId, {
      label_ar: parsed.data.label_ar,
      label_en: parsed.data.label_en ?? null,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      display_order: parsed.data.display_order,
      max_orders: parsed.data.max_orders ?? null,
      is_active: parsed.data.is_active,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/delivery-slots");
  redirect("/admin/delivery-slots");
}

export async function deactivateSlotAction(slotId: string) {
  await adminDeactivateTimeSlot(slotId);
  revalidatePath("/admin/delivery-slots");
}
