import type { BadgeTone } from "@/components/ui/badge";

/** Shared status → visual tone mapping, used by both the storefront
 * (next-intl labels) and the admin dashboard (hardcoded Arabic labels) so
 * the same status always reads the same color everywhere. */
export const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "info",
  PACKING: "info",
  OUT_FOR_DELIVERY: "brand",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export const PAYMENT_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  AWAITING_VERIFICATION: "warning",
  PAID: "success",
  VERIFIED: "success",
  FAILED: "danger",
  REJECTED: "danger",
  REFUNDED: "neutral",
};

export const SUBSCRIPTION_STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "danger",
};

export function toneFor(map: Record<string, BadgeTone>, status: string): BadgeTone {
  return map[status] ?? "neutral";
}
