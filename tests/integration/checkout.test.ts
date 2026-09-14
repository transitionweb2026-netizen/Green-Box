import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, serviceClient, type TestUser } from "./helpers";

describe("create_order business rules (live Supabase project)", () => {
  const admin = serviceClient();
  let user: TestUser;
  let addressId: string;
  let activeAreaId: string;
  let activeSlotId: string;
  let activePaymentMethodId: string;
  let availableProductId: string;
  let availableProductPrice: number;
  let minOrderQuantity: number;
  let reservationProductId: string;

  beforeAll(async () => {
    user = await createTestUser(admin, "checkout");

    const area = await admin
      .from("delivery_areas")
      .select("id, delivery_zones!inner(delivery_fee, is_active, min_order_amount)")
      .eq("is_active", true)
      .eq("delivery_zones.is_active", true)
      .not("delivery_zones.delivery_fee", "is", null)
      .limit(1)
      .single();
    if (area.error) throw area.error;
    activeAreaId = area.data.id;
    const minOrderAmount = (area.data as unknown as { delivery_zones: { min_order_amount: number | null } })
      .delivery_zones.min_order_amount;

    const slot = await admin.from("delivery_time_slots").select("id").eq("is_active", true).limit(1).single();
    if (slot.error) throw slot.error;
    activeSlotId = slot.data.id;

    const method = await admin.from("payment_methods").select("id").eq("is_active", true).limit(1).single();
    if (method.error) throw method.error;
    activePaymentMethodId = method.data.id;

    const product = await admin
      .from("products")
      .select("id, price")
      .eq("is_available", true)
      .eq("requires_reservation", false)
      .eq("product_type", "standard")
      .limit(1)
      .single();
    if (product.error) throw product.error;
    availableProductId = product.data.id;
    availableProductPrice = product.data.price;
    minOrderQuantity = minOrderAmount ? Math.ceil(minOrderAmount / availableProductPrice) + 1 : 1;

    const address = await user.client
      .from("addresses")
      .insert({
        profile_id: user.id,
        recipient_name: "Vitest Checkout",
        phone: "01000000002",
        delivery_area_id: activeAreaId,
        detailed_address: "Integration test checkout address",
      })
      .select("id")
      .single();
    if (address.error) throw address.error;
    addressId = address.data.id;
  });

  afterAll(async () => {
    if (reservationProductId) {
      await admin.from("products").update({ requires_reservation: false }).eq("id", reservationProductId);
    }
    // orders.profile_id has no cascade delete (NO ACTION) -- if a test
    // failed before reaching its own order cleanup, deleting the user
    // below would fail on the leftover FK reference. Sweep first so this
    // suite can't leave undeletable debris behind.
    const leftoverOrders = await admin.from("orders").select("id").eq("profile_id", user.id);
    for (const order of leftoverOrders.data ?? []) {
      await admin.from("payments").delete().eq("order_id", order.id);
      await admin.from("order_items").delete().eq("order_id", order.id);
      await admin.from("order_status_history").delete().eq("order_id", order.id);
      await admin.from("orders").delete().eq("id", order.id);
    }
    await deleteTestUser(admin, user.id);
  });

  async function freshCart() {
    // Only one active cart per profile is allowed (carts_one_active_per_profile_idx).
    // create_order() converts the cart to 'converted' on success, but a
    // rejected order leaves it 'active' -- clear any leftover first so
    // each test starts from a clean, single active cart.
    const leftover = await admin.from("carts").select("id").eq("profile_id", user.id).eq("status", "active");
    const leftoverIds = (leftover.data ?? []).map((c) => c.id);
    if (leftoverIds.length > 0) {
      await admin.from("cart_items").delete().in("cart_id", leftoverIds);
      await admin.from("carts").delete().in("id", leftoverIds);
    }

    const { data, error } = await user.client.from("carts").insert({ profile_id: user.id }).select("id").single();
    if (error) throw error;
    return data.id as string;
  }

  it("rejects an empty cart", async () => {
    const cartId = await freshCart();
    const { error } = await user.client.rpc("create_order", {
      p_cart_id: cartId,
      p_address_id: addressId,
      p_delivery_time_slot_id: activeSlotId,
      p_payment_method_id: activePaymentMethodId,
      p_delivery_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    });
    expect(error?.message).toMatch(/cart is empty/i);
  });

  it("rejects a delivery date in the past", async () => {
    const cartId = await freshCart();
    await user.client.from("cart_items").insert({ cart_id: cartId, product_id: availableProductId, quantity: 1 });
    const { error } = await user.client.rpc("create_order", {
      p_cart_id: cartId,
      p_address_id: addressId,
      p_delivery_time_slot_id: activeSlotId,
      p_payment_method_id: activePaymentMethodId,
      p_delivery_date: "2000-01-01",
    });
    expect(error?.message).toMatch(/cannot be in the past/i);
  });

  it("rejects a product marked unavailable", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        category_id: (await admin.from("categories").select("id").limit(1).single()).data!.id,
        product_type: "standard",
        slug: `vitest-unavailable-${Date.now()}`,
        name_ar: "منتج اختبار غير متاح",
        price: 10,
        is_available: false,
      })
      .select("id")
      .single();

    try {
      const cartId = await freshCart();
      await user.client.from("cart_items").insert({ cart_id: cartId, product_id: product!.id, quantity: 1 });
      const { error } = await user.client.rpc("create_order", {
        p_cart_id: cartId,
        p_address_id: addressId,
        p_delivery_time_slot_id: activeSlotId,
        p_payment_method_id: activePaymentMethodId,
        p_delivery_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      });
      expect(error?.message).toMatch(/no longer available/i);
    } finally {
      await admin.from("products").delete().eq("id", product!.id);
    }
  });

  it("enforces the configured reservation lead time on a product marked requires_reservation", async () => {
    reservationProductId = availableProductId;
    await admin.from("products").update({ requires_reservation: true }).eq("id", reservationProductId);

    const cartId = await freshCart();
    await user.client.from("cart_items").insert({ cart_id: cartId, product_id: reservationProductId, quantity: 1 });

    const todayResult = await user.client.rpc("create_order", {
      p_cart_id: cartId,
      p_address_id: addressId,
      p_delivery_time_slot_id: activeSlotId,
      p_payment_method_id: activePaymentMethodId,
      p_delivery_date: new Date().toISOString().slice(0, 10),
    });
    expect(todayResult.error?.message).toMatch(/advance reservation/i);

    await admin.from("products").update({ requires_reservation: false }).eq("id", reservationProductId);
    reservationProductId = "";
  });

  it("creates a real order end to end when every rule is satisfied, and cleans it up", async () => {
    const cartId = await freshCart();
    await user.client
      .from("cart_items")
      .insert({ cart_id: cartId, product_id: availableProductId, quantity: minOrderQuantity });

    const { data: order, error } = await user.client.rpc("create_order", {
      p_cart_id: cartId,
      p_address_id: addressId,
      p_delivery_time_slot_id: activeSlotId,
      p_payment_method_id: activePaymentMethodId,
      p_delivery_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    });

    expect(error).toBeNull();
    expect(order?.order_number).toMatch(/^GB-/);
    expect(order?.status).toBe("PENDING");

    // Cleanup: delete the test order and its dependents so this test is
    // fully repeatable and leaves no fixture behind (deleteTestUser in
    // afterAll would cascade this too, but being explicit here keeps the
    // test's own footprint self-contained and verifiable).
    if (order) {
      await admin.from("payments").delete().eq("order_id", order.id);
      await admin.from("order_items").delete().eq("order_id", order.id);
      await admin.from("order_status_history").delete().eq("order_id", order.id);
      await admin.from("orders").delete().eq("id", order.id);
    }
  });
});
