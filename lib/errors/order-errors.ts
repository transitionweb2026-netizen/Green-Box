/**
 * Maps the exact exception messages raised by create_order() (see
 * supabase/migrations/0019_create_order_date_and_capacity.sql) to a stable
 * error code the client can translate via checkout.errors.<code>. These
 * strings must stay in sync with the live SQL -- there is no other
 * machine-readable error taxonomy coming out of that function.
 */
export interface ClassifiedOrderError {
  code: string;
  productName?: string;
}

const EXACT_MATCHES: Record<string, string> = {
  "Not authenticated": "AUTH_REQUIRED",
  "Delivery date is required": "SELECT_REQUIRED",
  "Delivery date cannot be in the past": "INVALID_DATE",
  "Cart not found": "CART_EMPTY",
  "Cart is not active": "CART_EMPTY",
  "Cart is empty": "CART_EMPTY",
  "Address not found": "ADDRESS_INVALID",
  "This address is not in a currently served area": "ZONE_UNAVAILABLE",
  "This delivery zone is not currently active": "ZONE_UNAVAILABLE",
  "This delivery zone is not fully configured yet (missing delivery fee)": "ZONE_UNAVAILABLE",
  "Delivery time slot not available": "SLOT_UNAVAILABLE",
  "This delivery slot is fully booked for the selected date": "SLOT_FULL",
  "Payment method not available": "PAYMENT_UNAVAILABLE",
  "Order subtotal is below the minimum order amount for this zone": "MIN_ORDER_NOT_MET",
  "Loyalty program is not currently enabled": "LOYALTY_DISABLED",
  "Insufficient loyalty points balance": "LOYALTY_INSUFFICIENT",
  "Redemption amount is below the minimum allowed": "LOYALTY_MIN_NOT_MET",
};

const PRODUCT_UNAVAILABLE_RE = /^Product (.+) is no longer available$/;
const RESERVATION_LEAD_TIME_RE = /^Product (.+) requires at least \d+ day\(s\) advance reservation$/;

/** cancel_own_order() (migration 0025) exception messages. */
const CANCEL_ORDER_EXACT_MATCHES: Record<string, string> = {
  "Not authenticated": "AUTH_REQUIRED",
  "Order not found": "ORDER_NOT_FOUND",
  "This order can no longer be cancelled -- it is already being prepared": "CANCEL_TOO_LATE_STAGE",
  "Self-service cancellation is not currently available -- please contact us": "CANCEL_DISABLED",
  "Too close to the delivery time to cancel this order -- please contact us": "CANCEL_PAST_CUTOFF",
};

export function classifyCancelOrderError(message: string | undefined): string {
  if (!message) return "GENERIC";
  return CANCEL_ORDER_EXACT_MATCHES[message] ?? "GENERIC";
}

export function classifyOrderError(message: string | undefined): ClassifiedOrderError {
  if (!message) return { code: "GENERIC" };
  const productMatch = message.match(PRODUCT_UNAVAILABLE_RE);
  if (productMatch) return { code: "PRODUCT_UNAVAILABLE", productName: productMatch[1] };
  const reservationMatch = message.match(RESERVATION_LEAD_TIME_RE);
  if (reservationMatch) return { code: "RESERVATION_LEAD_TIME", productName: reservationMatch[1] };
  return { code: EXACT_MATCHES[message] ?? "GENERIC" };
}
