import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, serviceClient, type TestUser } from "./helpers";
import type { OrderStatus } from "@/types/database";

/**
 * Two-stage loyalty points (see supabase/migrations/0026_loyalty_pending_points.sql):
 * create_order() awards PENDING points immediately; update_order_status()
 * (admin) and cancel_own_order() (customer) resolve that same row to either
 * AVAILABLE (on DELIVERED) or CANCELLED (on CANCELLED). Never a new row --
 * the same transaction transitions in place.
 */
describe("Two-stage loyalty points: PENDING -> AVAILABLE / CANCELLED (live Supabase project)", () => {
  const admin = serviceClient();
  let owner: TestUser;
  let promotedAdmin: TestUser;
  let addressId: string;
  let activeAreaId: string;
  let activeSlotId: string;
  let activePaymentMethodId: string;
  let productId: string;
  let productPrice: number;
  let eligibleQuantity: number;
  let spendThreshold: number;
  let pointsPerThreshold: number;
  let redemptionUnit: number;
  let loyaltyWasEnabled: boolean;

  async function freshCart() {
    await admin.from("carts").delete().eq("profile_id", owner.id).eq("status", "active");
    const cart = await owner.client.from("carts").insert({ profile_id: owner.id }).select("id").single();
    if (cart.error) throw cart.error;
    return cart.data.id as string;
  }

  async function placeEligibleOrder(deliveryDateOffsetDays = 3) {
    const cartId = await freshCart();
    await owner.client.from("cart_items").insert({ cart_id: cartId, product_id: productId, quantity: eligibleQuantity });
    const deliveryDate = new Date(Date.now() + deliveryDateOffsetDays * 86400000).toISOString().slice(0, 10);
    const { data: order, error } = await owner.client.rpc("create_order", {
      p_cart_id: cartId,
      p_address_id: addressId,
      p_delivery_time_slot_id: activeSlotId,
      p_payment_method_id: activePaymentMethodId,
      p_delivery_date: deliveryDate,
    });
    if (error) throw error;
    return order!;
  }

  /**
   * Deletes an order's fixtures AND reverses whatever a leftover
   * loyalty_transactions row for it did to loyalty_accounts -- this bypasses
   * the trusted functions (direct service-role delete), so unlike
   * cancel_own_order()/update_order_status() it must undo the balance effect
   * itself, or a PENDING/AVAILABLE row's points would silently leak into
   * the next test's starting balance.
   */
  async function wipeOrder(orderId: string) {
    const earned = await admin
      .from("loyalty_transactions")
      .select("id, loyalty_account_id, status, points")
      .eq("order_id", orderId)
      .eq("type", "EARNED")
      .maybeSingle();

    if (earned.data) {
      // loyalty_accounts.Update is typed `never` everywhere else in this
      // codebase -- deliberately, since the app itself must only ever write
      // it through a trusted function. This test-only cleanup bypass
      // (reversing a direct fixture delete) needs an explicit cast for
      // exactly that reason, same as orders.Update in order-cancellation.test.ts.
      if (earned.data.status === "PENDING") {
        const account = await admin.from("loyalty_accounts").select("pending_points_balance").eq("id", earned.data.loyalty_account_id).single();
        await admin
          .from("loyalty_accounts")
          .update({ pending_points_balance: (account.data?.pending_points_balance ?? 0) - earned.data.points } as never)
          .eq("id", earned.data.loyalty_account_id);
      } else if (earned.data.status === "AVAILABLE") {
        const account = await admin
          .from("loyalty_accounts")
          .select("points_balance, lifetime_points_earned")
          .eq("id", earned.data.loyalty_account_id)
          .single();
        await admin
          .from("loyalty_accounts")
          .update({
            points_balance: (account.data?.points_balance ?? 0) - earned.data.points,
            lifetime_points_earned: (account.data?.lifetime_points_earned ?? 0) - earned.data.points,
          } as never)
          .eq("id", earned.data.loyalty_account_id);
      }
      // CANCELLED already reversed itself against pending_points_balance when it was cancelled.
    }

    await admin.from("loyalty_transactions").delete().eq("order_id", orderId);
    await admin.from("payments").delete().eq("order_id", orderId);
    await admin.from("order_items").delete().eq("order_id", orderId);
    await admin.from("order_status_history").delete().eq("order_id", orderId);
    await admin.from("orders").delete().eq("id", orderId);
  }

  async function advanceTo(orderId: string, statuses: OrderStatus[]) {
    for (const status of statuses) {
      const { error } = await promotedAdmin.client.rpc("update_order_status", {
        p_order_id: orderId,
        p_new_status: status,
      });
      if (error) throw new Error(`advance to ${status} failed: ${error.message}`);
    }
  }

  beforeAll(async () => {
    owner = await createTestUser(admin, "loyalty-pending-owner");
    promotedAdmin = await createTestUser(admin, "loyalty-pending-admin");
    const promote = await admin.from("profiles").update({ role: "admin" }).eq("id", promotedAdmin.id);
    if (promote.error) throw promote.error;

    const settings = await admin.from("loyalty_settings").select("*").eq("id", 1).single();
    if (settings.error) throw settings.error;
    loyaltyWasEnabled = settings.data.is_enabled;
    spendThreshold = settings.data.spend_threshold;
    pointsPerThreshold = settings.data.points_per_threshold;
    redemptionUnit = settings.data.redemption_points_unit;
    if (!loyaltyWasEnabled) {
      await admin.from("loyalty_settings").update({ is_enabled: true }).eq("id", 1);
    }

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
    productId = product.data.id;
    productPrice = product.data.price;

    // Eligible for at least 1 points_per_threshold award, and clears the
    // zone's own minimum order amount -- both real, existing configs, not
    // hardcoded assumptions.
    const minForPoints = Math.ceil(spendThreshold / productPrice) + 1;
    const minForZone = minOrderAmount ? Math.ceil(minOrderAmount / productPrice) + 1 : 1;
    eligibleQuantity = Math.max(minForPoints, minForZone);

    const address = await owner.client
      .from("addresses")
      .insert({
        profile_id: owner.id,
        recipient_name: "Vitest Loyalty Pending",
        phone: "01000000005",
        delivery_area_id: activeAreaId,
        detailed_address: "Integration test loyalty-pending address",
      })
      .select("id")
      .single();
    if (address.error) throw address.error;
    addressId = address.data.id;
  });

  afterAll(async () => {
    const leftover = await admin.from("orders").select("id").eq("profile_id", owner.id);
    for (const order of leftover.data ?? []) await wipeOrder(order.id);
    if (!loyaltyWasEnabled) {
      await admin.from("loyalty_settings").update({ is_enabled: false }).eq("id", 1);
    }
    await deleteTestUser(admin, owner.id);
    await deleteTestUser(admin, promotedAdmin.id);
  });

  it("TEST 1: an eligible order immediately gets PENDING points, available balance unchanged", async () => {
    const before = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).maybeSingle();
    const beforeAvailable = before.data?.points_balance ?? 0;

    const order = await placeEligibleOrder();
    try {
      const expectedPoints =
        Math.floor((productPrice * eligibleQuantity) / spendThreshold) * pointsPerThreshold;
      expect(expectedPoints).toBeGreaterThan(0);

      const account = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).single();
      expect(account.data?.pending_points_balance).toBe(expectedPoints);
      expect(account.data?.points_balance).toBe(beforeAvailable);

      const tx = await admin
        .from("loyalty_transactions")
        .select("*")
        .eq("order_id", order.id)
        .eq("type", "EARNED")
        .single();
      expect(tx.data?.status).toBe("PENDING");
      expect(tx.data?.points).toBe(expectedPoints);
      expect(tx.data?.available_at).toBeNull();
    } finally {
      await wipeOrder(order.id);
    }
  });

  it("TEST 2 + 3: points stay PENDING through the whole lifecycle, then become AVAILABLE on DELIVERED", async () => {
    const order = await placeEligibleOrder();
    try {
      const txId = (
        await admin.from("loyalty_transactions").select("id, points").eq("order_id", order.id).eq("type", "EARNED").single()
      ).data!;

      // TEST 2: walk through every non-terminal stage; points must stay PENDING throughout.
      await advanceTo(order.id, ["CONFIRMED", "PREPARING", "PACKING", "OUT_FOR_DELIVERY"]);
      const stillPending = await admin.from("loyalty_transactions").select("status").eq("id", txId.id).single();
      expect(stillPending.data?.status).toBe("PENDING");

      const accountMidway = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).single();
      expect(accountMidway.data?.pending_points_balance).toBe(txId.points);

      const availableBeforeDelivery = accountMidway.data!.points_balance;

      // TEST 3: DELIVERED resolves the SAME row to AVAILABLE.
      await advanceTo(order.id, ["DELIVERED"]);

      const resolved = await admin.from("loyalty_transactions").select("*").eq("id", txId.id).single();
      expect(resolved.data?.status).toBe("AVAILABLE");
      expect(resolved.data?.available_at).not.toBeNull();

      const accountAfter = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).single();
      expect(accountAfter.data?.points_balance).toBe(availableBeforeDelivery + txId.points);
      expect(accountAfter.data?.pending_points_balance).toBe(0);

      // Exactly one EARNED row for this order -- no duplicate was created
      // by the transition (idempotency: same row, not a new insert).
      const earnedRows = await admin.from("loyalty_transactions").select("id").eq("order_id", order.id).eq("type", "EARNED");
      expect(earnedRows.data?.length).toBe(1);
    } finally {
      await wipeOrder(order.id);
    }
  });

  it("TEST 4: cancelling a PENDING order voids its pending points without crediting available balance", async () => {
    const order = await placeEligibleOrder();
    try {
      const txBefore = await admin
        .from("loyalty_transactions")
        .select("id, points")
        .eq("order_id", order.id)
        .eq("type", "EARNED")
        .single();
      expect(txBefore.data?.points).toBeGreaterThan(0);

      const accountBefore = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).single();
      const availableBefore = accountBefore.data!.points_balance;

      const { data: cancelled, error } = await owner.client.rpc("cancel_own_order", { p_order_id: order.id });
      expect(error).toBeNull();
      expect(cancelled?.status).toBe("CANCELLED");

      const txAfter = await admin.from("loyalty_transactions").select("*").eq("id", txBefore.data!.id).single();
      expect(txAfter.data?.status).toBe("CANCELLED");
      expect(txAfter.data?.cancelled_at).not.toBeNull();

      const accountAfter = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).single();
      expect(accountAfter.data?.pending_points_balance).toBe(0);
      expect(accountAfter.data?.points_balance).toBe(availableBefore);
    } finally {
      await wipeOrder(order.id);
    }
  });

  it("TEST 4b: an admin cancelling a PENDING order (update_order_status) voids pending points the same way", async () => {
    const order = await placeEligibleOrder();
    try {
      const txBefore = await admin
        .from("loyalty_transactions")
        .select("id, points")
        .eq("order_id", order.id)
        .eq("type", "EARNED")
        .single();

      const { error } = await promotedAdmin.client.rpc("update_order_status", {
        p_order_id: order.id,
        p_new_status: "CANCELLED",
      });
      expect(error).toBeNull();

      const txAfter = await admin.from("loyalty_transactions").select("status").eq("id", txBefore.data!.id).single();
      expect(txAfter.data?.status).toBe("CANCELLED");

      const account = await admin.from("loyalty_accounts").select("pending_points_balance").eq("profile_id", owner.id).single();
      expect(account.data?.pending_points_balance).toBe(0);
    } finally {
      await wipeOrder(order.id);
    }
  });

  it("TEST 5 (idempotency): the DB rejects a second EARNED row for the same order", async () => {
    const order = await placeEligibleOrder();
    try {
      const existing = await admin
        .from("loyalty_transactions")
        .select("loyalty_account_id")
        .eq("order_id", order.id)
        .eq("type", "EARNED")
        .single();

      const dup = await admin.from("loyalty_transactions").insert({
        loyalty_account_id: existing.data!.loyalty_account_id,
        type: "EARNED",
        status: "PENDING",
        points: 1,
        balance_after: 0,
        order_id: order.id,
        reason: "duplicate attempt -- should be rejected",
      } as never);

      expect(dup.error).not.toBeNull();
      expect(dup.error?.message).toMatch(/duplicate key|unique/i);
    } finally {
      await wipeOrder(order.id);
    }
  });

  it("TEST 6: loyalty disabled at order creation means no pending points at all", async () => {
    await admin.from("loyalty_settings").update({ is_enabled: false }).eq("id", 1);
    try {
      const order = await placeEligibleOrder();
      try {
        const tx = await admin.from("loyalty_transactions").select("id").eq("order_id", order.id).eq("type", "EARNED");
        expect(tx.data?.length ?? 0).toBe(0);
      } finally {
        await wipeOrder(order.id);
      }
    } finally {
      await admin.from("loyalty_settings").update({ is_enabled: true }).eq("id", 1);
    }
  });

  it("TEST 7: pending points can never be redeemed -- only points_balance counts", async () => {
    const before = await admin.from("loyalty_accounts").select("points_balance").eq("profile_id", owner.id).maybeSingle();
    const availableBaseline = before.data?.points_balance ?? 0;

    const order = await placeEligibleOrder();
    try {
      const account = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).single();
      expect(account.data?.pending_points_balance).toBeGreaterThan(0);
      expect(account.data?.points_balance).toBe(availableBaseline);

      // Attempting to redeem more than the available (non-pending) balance
      // must fail: create_order()'s redemption check reads points_balance
      // only, never pending_points_balance, no matter how many points are
      // pending on this very order. Must be a valid block multiple (see
      // 0027_loyalty_redemption_hardening.sql) so this fails on
      // "insufficient balance" specifically, not on the unit-size check.
      const attemptPoints = (Math.floor(availableBaseline / redemptionUnit) + 1) * redemptionUnit;
      const cartId = await freshCart();
      await owner.client.from("cart_items").insert({ cart_id: cartId, product_id: productId, quantity: eligibleQuantity });
      const { error } = await owner.client.rpc("create_order", {
        p_cart_id: cartId,
        p_address_id: addressId,
        p_delivery_time_slot_id: activeSlotId,
        p_payment_method_id: activePaymentMethodId,
        p_delivery_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        p_redeem_points: attemptPoints,
      });
      expect(error?.message).toMatch(/insufficient loyalty points balance/i);
    } finally {
      await wipeOrder(order.id);
    }
  });
});
