"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  adminCreateArea,
  adminCreateZone,
  adminDeactivateArea,
  adminDeactivateZone,
  adminUpdateZone,
} from "@/lib/services/delivery";

const zoneSchema = z.object({
  name_ar: z.string().trim().min(1).max(150),
  name_en: z.string().trim().max(150).optional(),
  delivery_fee: z.coerce.number().min(0).optional(),
  min_order_amount: z.coerce.number().min(0).optional(),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
  notes: z.string().trim().max(500).optional(),
});

export type ZoneActionState = { status: "idle" | "error"; message?: string };

function parseZoneForm(formData: FormData) {
  const fee = String(formData.get("delivery_fee") ?? "").trim();
  const minOrder = String(formData.get("min_order_amount") ?? "").trim();
  return zoneSchema.safeParse({
    name_ar: String(formData.get("name_ar") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim() || undefined,
    delivery_fee: fee ? Number(fee) : undefined,
    min_order_amount: minOrder ? Number(minOrder) : undefined,
    display_order: formData.get("display_order") ?? 0,
    is_active: formData.get("is_active") === "on",
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
}

export async function createZoneAction(_prevState: ZoneActionState, formData: FormData): Promise<ZoneActionState> {
  const parsed = parseZoneForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminCreateZone({
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      delivery_fee: parsed.data.delivery_fee ?? null,
      min_order_amount: parsed.data.min_order_amount ?? null,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
      notes: parsed.data.notes ?? null,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/delivery-zones");
  redirect("/admin/delivery-zones");
}

export async function updateZoneAction(
  zoneId: string,
  _prevState: ZoneActionState,
  formData: FormData,
): Promise<ZoneActionState> {
  const parsed = parseZoneForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminUpdateZone(zoneId, {
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en ?? null,
      delivery_fee: parsed.data.delivery_fee ?? null,
      min_order_amount: parsed.data.min_order_amount ?? null,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
      notes: parsed.data.notes ?? null,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ" };
  }

  revalidatePath("/admin/delivery-zones");
  revalidatePath(`/admin/delivery-zones/${zoneId}/edit`);
  return { status: "idle" };
}

export async function deactivateZoneAction(zoneId: string) {
  await adminDeactivateZone(zoneId);
  revalidatePath("/admin/delivery-zones");
}

const areaSchema = z.object({
  governorate: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  area: z.string().trim().min(1).max(100),
});

export type AreaActionState = { status: "idle" | "error"; message?: string };

export async function addAreaAction(
  zoneId: string,
  _prevState: AreaActionState,
  formData: FormData,
): Promise<AreaActionState> {
  const parsed = areaSchema.safeParse({
    governorate: String(formData.get("governorate") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    area: String(formData.get("area") ?? "").trim(),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  try {
    await adminCreateArea({ delivery_zone_id: zoneId, ...parsed.data });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "حصل خطأ (ربما المنطقة مكررة)" };
  }

  revalidatePath(`/admin/delivery-zones/${zoneId}/edit`);
  return { status: "idle" };
}

export async function deactivateAreaAction(zoneId: string, areaId: string) {
  await adminDeactivateArea(areaId);
  revalidatePath(`/admin/delivery-zones/${zoneId}/edit`);
}
