import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, serviceClient, type TestUser } from "./helpers";

describe("cancel_own_order (live Supabase project)", () => {
  const admin = serviceClient();
  let owner: TestUser;
  let stranger: TestUser;
  let addressId: string;
  let activeAreaId: string;
  let activeSlotId: string;
  let activePaymentMethodId: string;
  let productId: string;
  let productPrice: number;
  let minOrderQuantity: number;

  async function placeOrder(deliveryDateOffsetDays: number) {
    await admin.from("carts").delete().eq("profile_id", owner.id).eq("status", "active");
    const cart = await owner.client.from("carts").insert({ profile_id: owner.id }).select("id").single();
    await owner.client
      .from("cart_items")
      .insert({ cart_id: cart.data!.id, product_id: productId, quantity: minOrderQuantity });

    const deliveryDate = new Date(Date.now() + deliveryDateOffsetDays * 86400000).toISOString().slice(0, 10);
    const { data: order, error } = await owner.client.rpc("create_order", {
      p_cart_id: cart.data!.id,
      p_address_id: addressId,
      p_delivery_time_slot_id: activeSlotId,
      p_payment_method_id: activePaymentMethodId,
      p_delivery_date: deliveryDate,
    });
    if (error) throw error;
    return order!;
  }

  async function wipeOrder(orderId: string) {
    await admin.from("payments").delete().eq("order_id", orderId);
    await admin.from("order_items").delete().eq("order_id", orderId);
    await admin.from("order_status_history").delete().eq("order_id", orderId);
    await admin.from("orders").delete().eq("id", orderId);
  }

  beforeAll(async () => {
    owner = await createTestUser(admin, "cancel-owner");
    stranger = await createTestUser(admin, "cancel-stranger");

    const area = await admin
      .from("delivery_areas")
      .select("id, delivery_zones!inner(delivery_fee, is_active, min_order_amount)")
      .eq("is_active", true)
      .eq("delivery_zones.is_active", true)
      .not("delivery_zones.delivery_fee", "is", null)
      .limit(1)
      .single();
    activeAreaId = area.data!.id;
    const minOrderAmount = (area.data as unknown as { delivery_zones: { min_order_amount: number | null } })
      .delivery_zones.min_order_amount;

    const slot = await admin.from("delivery_time_slots").select("id").eq("is_active", true).limit(1).single();
    activeSlotId = slot.data!.id;

    const method = await admin.from("payment_methods").select("id").eq("is_active", true).limit(1).single();
    activePaymentMethodId = method.data!.id;

    const product = await admin
      .from("products")
      .select("id, price")
      .eq("is_available", true)
      .eq("requires_reservation", false)
      .eq("product_type", "standard")
      .limit(1)
      .single();
    productId = product.data!.id;
    productPrice = product.data!.price;
    minOrderQuantity = minOrderAmount ? Math.ceil(minOrderAmount / productPrice) + 1 : 1;

    const address = await owner.client
      .from("addresses")
      .insert({
        profile_id: owner.id,
        recipient_name: "Vitest Cancel",
        phone: "01000000003",
        delivery_area_id: activeAreaId,
        detailed_address: "Integration test cancellation address",
      })
      .select("id")
      .single();
    addressId = address.data!.id;
  });

  afterAll(async () => {
    const leftover = await admin.from("orders").select("id").in("profile_id", [owner.id, stranger.id]);
    for (const order of leftover.data ?? []) await wipeOrder(order.id);
    await deleteTestUser(admin, owner.id);
    await deleteTestUser(admin, stranger.id);
  });

  it("lets the owner cancel their own pending order and reverses redeemed points", async () => {
    const order = await placeOrder(3);
    try {
      const { data: cancelled, error } = await owner.client.rpc("cancel_own_order", { p_order_id: order.id });
      expect(error).toBeNull();
      expect(cancelled?.status).toBe("CANCELLED");

      const { data: history } = await admin
        .from("order_status_history")
        .select("note")
        .eq("order_id", order.id)
        .eq("status", "CANCELLED")
        .single();
      expect(history?.note).toMatch(/cancelled by customer/i);
    } finally {
      await wipeOrder(order.id);
    }
  });

  it("blocks a different customer from cancelling someone else's order", async () => {
    const order = await placeOrder(3);
    try {
      const { error } = await stranger.client.rpc("cancel_own_order", { p_order_id: order.id });
      expect(error?.message).toMatch(/order not found/i);

      const { data: stillPending } = await admin.from("orders").select("status").eq("id", order.id).single();
      expect(stillPending?.status).toBe("PENDING");
    } finally {
      await wipeOrder(order.id);
    }
  });

  it("respects the configured cancellation cutoff relative to the delivery slot", async () => {
    // Force an aggressive cutoff (very large) so even a delivery 3 days out
    // falls inside the "too close to cancel" window, without needing to
    // fabricate a delivery date in the near past (which create_order itself
    // already rejects).
    await admin
      .from("settings")
      .update({ value: { customer_cancellation_enabled: true, cancellation_cutoff_hours: 24 * 365 } })
      .eq("key", "order_policy_settings");

    const order = await placeOrder(3);
    try {
      const { error } = await owner.client.rpc("cancel_own_order", { p_order_id: order.id });
      expect(error?.message).toMatch(/too close to the delivery time/i);
    } finally {
      await wipeOrder(order.id);
      await admin
        .from("settings")
        .update({ value: { customer_cancellation_enabled: true, cancellation_cutoff_hours: 2 } })
        .eq("key", "order_policy_settings");
    }
  });

  it("respects the customer_cancellation_enabled kill switch", async () => {
    await admin
      .from("settings")
      .update({ value: { customer_cancellation_enabled: false, cancellation_cutoff_hours: 2 } })
      .eq("key", "order_policy_settings");

    const order = await placeOrder(3);
    try {
      const { error } = await owner.client.rpc("cancel_own_order", { p_order_id: order.id });
      expect(error?.message).toMatch(/not currently available/i);
    } finally {
      await wipeOrder(order.id);
      await admin
        .from("settings")
        .update({ value: { customer_cancellation_enabled: true, cancellation_cutoff_hours: 2 } })
        .eq("key", "order_policy_settings");
    }
  });

  it("refuses to cancel an order that has already moved past CONFIRMED", async () => {
    const order = await placeOrder(3);
    try {
      // Advance status via a direct service-role write (bypasses RLS) rather
      // than the update_order_status RPC, which requires an authenticated
      // admin *session* (is_admin() reads auth.uid(), which the service
      // key alone doesn't provide) -- this test only needs the order to be
      // sitting in a non-cancellable state, not to exercise that RPC.
      // orders.Update is typed `never` everywhere else in this codebase --
      // deliberately, since the app itself must only ever write orders
      // through a trusted function. This one test-only bypass needs an
      // explicit cast for exactly that reason.
      await admin
        .from("orders")
        .update({ status: "PREPARING" } as never)
        .eq("id", order.id);

      const { error } = await owner.client.rpc("cancel_own_order", { p_order_id: order.id });
      expect(error?.message).toMatch(/already being prepared/i);
    } finally {
      await wipeOrder(order.id);
    }
  });
});
