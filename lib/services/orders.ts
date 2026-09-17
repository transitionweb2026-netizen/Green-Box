import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, Tables } from "@/types/database";
import { addToCart, getOrCreateActiveCart } from "./cart";

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderStatusHistory = Tables<"order_status_history">;
export type Payment = Tables<"payments">;

export interface CreateOrderInput {
  cartId: string;
  addressId: string;
  deliveryTimeSlotId: string;
  paymentMethodId: string;
  deliveryDate: string;
  customerNotes?: string | null;
  redeemPoints?: number;
}

/**
 * The only path by which an order is created -- calls the create_order()
 * trusted database function, which recomputes every price server-side.
 * See DATABASE.md, "Trusted Mutation Functions". Never trust a
 * client-supplied price/subtotal/total anywhere in this codebase.
 * `deliveryDate` (plus per-slot `max_orders`) is validated and capacity-
 * checked inside create_order() itself -- see migration
 * 0019_create_order_date_and_capacity.sql -- not just here.
 */
export async function createOrderFromCart(input: CreateOrderInput): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_cart_id: input.cartId,
    p_address_id: input.addressId,
    p_delivery_time_slot_id: input.deliveryTimeSlotId,
    p_payment_method_id: input.paymentMethodId,
    p_customer_notes: input.customerNotes ?? null,
    p_redeem_points: input.redeemPoints ?? 0,
    p_delivery_date: input.deliveryDate,
  });
  // supabase-js only wraps this in a proper `Error` (via `.throwOnError()`)
  // when explicitly asked; a plain `{ data, error }` result carries `error`
  // as a bare JSON object, so re-throwing it verbatim produced an object
  // that failed every downstream `err instanceof Error` check in
  // classifyOrderError() -- every create_order() failure, regardless of
  // cause, silently fell through to the GENERIC checkout error message.
  if (error) throw new Error(error.message);
  return data as unknown as Order;
}

/**
 * Calls cancel_own_order() (migration 0025) -- the only path by which a
 * customer can cancel their own order. Enforces ownership, allowed
 * statuses, the admin-configurable cutoff, and the loyalty-points reversal
 * server-side; never trust a client-side "can this be cancelled" check
 * alone (the UI's own check is just to avoid showing a button that would
 * fail, not the real boundary).
 */
export async function cancelMyOrder(orderId: string): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_own_order", { p_order_id: orderId });
  // Same reason as createOrderFromCart() above -- must be a real Error for
  // classifyCancelOrderError()'s `err instanceof Error` check to see it.
  if (error) throw new Error(error.message);
  return data as unknown as Order;
}

export async function listMyOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface OrderDetail extends Order {
  order_items: OrderItem[];
  order_status_history: OrderStatusHistory[];
  payments: Payment[];
}

/** Shape of orders.address_snapshot, frozen onto the order at checkout time
 * (see create_order() in supabase/migrations) so it stays accurate even if
 * the customer later edits or deletes the address itself. */
export interface OrderAddressSnapshot {
  label?: string;
  recipient_name: string;
  phone: string;
  governorate: string;
  city: string;
  area: string;
  zone_name_ar?: string;
  zone_name_en?: string;
  detailed_address: string;
  landmark?: string;
}

/** Shape of orders.delivery_slot_snapshot -- same freezing rationale as
 * OrderAddressSnapshot above. */
export interface OrderSlotSnapshot {
  label_ar: string;
  label_en?: string;
  start_time: string;
  end_time: string;
}

export async function getOrderById(orderId: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*), payments(*)")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    order_status_history: [...data.order_status_history].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  } as OrderDetail;
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*), payments(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  return data as OrderDetail | null;
}

export interface ReorderResult {
  addedCount: number;
  unavailableItems: string[];
}

/**
 * Adds an old order's items to the customer's active cart at CURRENT
 * prices -- cart_items never stores a price (see lib/services/cart.ts),
 * it's always looked up live at cart-summary/checkout time, so this needs
 * no special price handling. Products that were deleted since (product_id
 * null on the order_items row -- see order_items_product_id_fkey, ON
 * DELETE SET NULL) or are currently unavailable are skipped, not added;
 * their names are returned so the caller can tell the customer which
 * items didn't carry over. Never creates an order itself -- populates the
 * cart only, same as any other "add to cart" action.
 */
export async function reorderFromOrder(orderId: string): Promise<ReorderResult> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_items(product_id, product_name_ar, quantity)")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new Error("Order not found");

  const productIds = order.order_items.map((item) => item.product_id).filter((id): id is string => id !== null);

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, is_available")
    .in("id", productIds.length > 0 ? productIds : ["00000000-0000-0000-0000-000000000000"]);
  if (productsError) throw productsError;
  const availableIds = new Set((products ?? []).filter((p) => p.is_available).map((p) => p.id));

  const cart = await getOrCreateActiveCart();

  let addedCount = 0;
  const unavailableItems: string[] = [];

  for (const item of order.order_items) {
    if (!item.product_id || !availableIds.has(item.product_id)) {
      unavailableItems.push(item.product_name_ar);
      continue;
    }
    await addToCart(cart.id, item.product_id, item.quantity);
    addedCount += 1;
  }

  return { addedCount, unavailableItems };
}

// --- Admin -------------------------------------------------------------

export interface AdminListOrdersOptions {
  status?: OrderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminOrderRow extends Order {
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
}

export async function adminListOrders(options: AdminListOrdersOptions = {}) {
  const { status, search, page = 1, pageSize = 25 } = options;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, profiles(full_name, email, phone)", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("order_number", `%${search}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { orders: (data as AdminOrderRow[]) ?? [], total: count ?? 0, page, pageSize };
}

/** Admin-only (enforced by update_order_status()'s own is_admin() check). */
export async function adminUpdateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_order_status", {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data as unknown as Order;
}

export async function adminVerifyPayment(
  paymentId: string,
  newStatus: "VERIFIED" | "REJECTED" | "REFUNDED" | "PENDING" | "AWAITING_VERIFICATION",
  notes?: string,
): Promise<Payment> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_payment_verification", {
    p_payment_id: paymentId,
    p_new_status: newStatus,
    p_notes: notes ?? null,
  });
  if (error) throw error;
  return data as unknown as Payment;
}

/** Legal next steps for the visual tracking timeline / admin status dropdown. */
export function nextLegalStatuses(current: OrderStatus): OrderStatus[] {
  const sequence: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED"];
  if (current === "DELIVERED" || current === "CANCELLED") return [];
  const idx = sequence.indexOf(current);
  const next = sequence[idx + 1];
  return next ? [next, "CANCELLED"] : ["CANCELLED"];
}
