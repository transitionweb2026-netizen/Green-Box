"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAddress, deleteAddress, setDefaultAddress, updateAddress } from "@/lib/services/addresses";

const addressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  deliveryAreaId: z.string().uuid(),
  detailedAddress: z.string().trim().min(3).max(300),
  landmark: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(300).optional(),
  isDefault: z.boolean().optional(),
});

export type AddressActionState = { status: "idle" | "error"; errorCode?: "VALIDATION" | "GENERIC" };

function parseAddressForm(formData: FormData) {
  return addressSchema.safeParse({
    label: String(formData.get("label") ?? "").trim() || undefined,
    recipientName: String(formData.get("recipientName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    deliveryAreaId: String(formData.get("deliveryAreaId") ?? ""),
    detailedAddress: String(formData.get("detailedAddress") ?? "").trim(),
    landmark: String(formData.get("landmark") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    isDefault: formData.get("isDefault") === "on",
  });
}

export async function createAddressAction(
  locale: string,
  _prevState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const parsed = parseAddressForm(formData);
  if (!parsed.success) return { status: "error", errorCode: "VALIDATION" };

  try {
    await createAddress({
      label: parsed.data.label ?? null,
      recipient_name: parsed.data.recipientName,
      phone: parsed.data.phone,
      delivery_area_id: parsed.data.deliveryAreaId,
      detailed_address: parsed.data.detailedAddress,
      landmark: parsed.data.landmark ?? null,
      notes: parsed.data.notes ?? null,
      is_default: parsed.data.isDefault ?? false,
    });
  } catch {
    return { status: "error", errorCode: "GENERIC" };
  }

  revalidatePath(`/${locale}/account/addresses`);
  redirect(`/${locale}/account/addresses`);
}

export async function updateAddressAction(
  locale: string,
  addressId: string,
  _prevState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const parsed = parseAddressForm(formData);
  if (!parsed.success) return { status: "error", errorCode: "VALIDATION" };

  try {
    await updateAddress(addressId, {
      label: parsed.data.label ?? null,
      recipient_name: parsed.data.recipientName,
      phone: parsed.data.phone,
      delivery_area_id: parsed.data.deliveryAreaId,
      detailed_address: parsed.data.detailedAddress,
      landmark: parsed.data.landmark ?? null,
      notes: parsed.data.notes ?? null,
      is_default: parsed.data.isDefault ?? false,
    });
  } catch {
    return { status: "error", errorCode: "GENERIC" };
  }

  revalidatePath(`/${locale}/account/addresses`);
  redirect(`/${locale}/account/addresses`);
}

export async function deleteAddressAction(locale: string, addressId: string) {
  await deleteAddress(addressId);
  revalidatePath(`/${locale}/account/addresses`);
}

export async function setDefaultAddressAction(locale: string, addressId: string) {
  await setDefaultAddress(addressId);
  revalidatePath(`/${locale}/account/addresses`);
}
