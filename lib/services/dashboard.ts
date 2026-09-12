import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  revenueDelivered: number;
  customerCount: number;
  productCount: number;
  unavailableProductCount: number;
  recentOrders: {
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    profiles: { full_name: string | null; email: string | null } | null;
  }[];
}

/**
 * "Low-stock products" from a typical admin dashboard doesn't map to this
 * schema -- products only have an is_available boolean, not a stock
 * count (see DECISIONS.md Q10, deliberately not invented). This reports
 * unavailable product count instead, which is the honest equivalent.
 */
export async function adminGetDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [ordersRes, pendingRes, deliveredRes, customersRes, productsRes, unavailableRes, recentRes] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("orders").select("total").eq("status", "DELIVERED"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_available", false),
    supabase
      .from("orders")
      .select("id, order_number, status, total, created_at, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const revenueDelivered = (deliveredRes.data ?? []).reduce((sum, o) => sum + o.total, 0);

  return {
    totalOrders: ordersRes.count ?? 0,
    pendingOrders: pendingRes.count ?? 0,
    revenueDelivered,
    customerCount: customersRes.count ?? 0,
    productCount: productsRes.count ?? 0,
    unavailableProductCount: unavailableRes.count ?? 0,
    recentOrders: (recentRes.data as DashboardStats["recentOrders"]) ?? [],
  };
}
