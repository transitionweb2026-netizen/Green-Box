import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, Tables } from "@/types/database";

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderStatusHistory = Tables<"order_status_history">;
export type Payment = Tables<"payments">;

export interface CreateOrderInput {
  cartId: string;
  addressId: string;
  deliveryTimeSlotId: string;
  paymentMethodId: string;
  customerNotes?: string | null;
  redeemPoints?: number;
}

/**
 * The only path by which an order is created -- calls the create_order()
 * trusted database function, which recomputes every price server-side.
 * See DATABASE.md, "Trusted Mutation Functions". Never trust a
 * client-supplied price/subtotal/total anywhere in this codebase.
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
  });
  if (error) throw error;
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
