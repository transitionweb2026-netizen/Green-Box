import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, serviceClient, type TestUser } from "./helpers";

/**
 * Loyalty points REDEMPTION (create_order()'s existing p_redeem_points
 * path, hardened by supabase/migrations/0027_loyalty_redemption_hardening.sql):
 * block-based redemption against loyalty_accounts.points_balance only
 * (never pending_points_balance), server-computed discount, atomic with
 * order creation, race-safe via row locks. See that migration's header for
 * the three gaps it closed on top of the pre-existing logic.
 */
describe("Loyalty points redemption (live Supabase project)", () => {
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
  let redemptionUnit: number;
  let redemptionValuePerUnit: number;
  let minRedeemablePoints: number | null;
  let deliveryFee: number;
  let loyaltyWasEnabled: boolean;

  async function freshCart() {
    await admin.from("carts").delete().eq("profile_id", owner.id).eq("status", "active");
    const cart = await owner.client.from("carts").insert({ profile_id: owner.id }).select("id").single();
    if (cart.error) throw cart.error;
    return cart.data.id as string;
  }

  /** A cart whose subtotal is comfortably below the zone's min-order-amount
   * requirement is NOT used here -- every redemption test needs a real,
   * order-eligible cart, so quantity is always eligibleQuantity. */
  async function cartWithProduct() {
    const cartId = await freshCart();
    const { error } = await owner.client.from("cart_items").insert({ cart_id: cartId, product_id: productId, quantity: eligibleQuantity });
    if (error) throw error;
    return cartId;
  }

  function placeOrder(cartId: string, redeemPoints: number, deliveryDateOffsetDays = 3) {
    return owner.client.rpc("create_order", {
      p_cart_id: cartId,
      p_address_id: addressId,
      p_delivery_time_slot_id: activeSlotId,
      p_payment_method_id: activePaymentMethodId,
      p_delivery_date: new Date(Date.now() + deliveryDateOffsetDays * 86400000).toISOString().slice(0, 10),
      p_redeem_points: redeemPoints,
    });
  }

  async function wipeOrder(orderId: string) {
    const earned = await admin
      .from("loyalty_transactions")
      .select("id, loyalty_account_id, status, points")
      .eq("order_id", orderId)
      .eq("type", "EARNED")
      .maybeSingle();

    if (earned.data) {
      if (earned.data.status === "PENDING") {
        const account = await admin.from("loyalty_accounts").select("pending_points_balance").eq("id", earned.data.loyalty_account_id).single();
        await admin
          .from("loyalty_accounts")
          .update({ pending_points_balance: (account.data?.pending_points_balance ?? 0) - earned.data.points } as never)
          .eq("id", earned.data.loyalty_account_id);
      } else if (earned.data.status === "AVAILABLE") {
        const account = await admin.from("loyalty_accounts").select("points_balance, lifetime_points_earned").eq("id", earned.data.loyalty_account_id).single();
        await admin
          .from("loyalty_accounts")
          .update({
            points_balance: (account.data?.points_balance ?? 0) - earned.data.points,
            lifetime_points_earned: (account.data?.lifetime_points_earned ?? 0) - earned.data.points,
          } as never)
          .eq("id", earned.data.loyalty_account_id);
      }
    }

    // Undo any REDEEMED transaction's effect the same way, so redemption
    // tests don't leak balance/lifetime state into each other either.
    const redemptions = await admin.from("loyalty_transactions").select("id, loyalty_account_id, points").eq("order_id", orderId).eq("type", "REDEEMED");
    for (const row of redemptions.data ?? []) {
      const account = await admin.from("loyalty_accounts").select("points_balance, lifetime_points_redeemed").eq("id", row.loyalty_account_id).single();
      await admin
        .from("loyalty_accounts")
        .update({
          points_balance: (account.data?.points_balance ?? 0) - row.points, // row.points is negative for REDEEMED
          lifetime_points_redeemed: (account.data?.lifetime_points_redeemed ?? 0) + row.points,
        } as never)
        .eq("id", row.loyalty_account_id);
    }

    await admin.from("loyalty_transactions").delete().eq("order_id", orderId);
    await admin.from("payments").delete().eq("order_id", orderId);
    await admin.from("order_items").delete().eq("order_id", orderId);
    await admin.from("order_status_history").delete().eq("order_id", orderId);
    await admin.from("orders").delete().eq("id", orderId);
  }

  /** Resets the owner's AVAILABLE (not pending) balance to an exact value
   * via the existing admin_adjust_loyalty_points() trusted function --
   * reused deliberately instead of writing loyalty_accounts directly, so
   * fixture setup exercises the same real ADJUSTED-transaction path an
   * admin would use, and each test starts from a known, isolated balance. */
  async function setAvailableBalance(points: number) {
    const current = await admin.from("loyalty_accounts").select("points_balance").eq("profile_id", owner.id).maybeSingle();
    const currentBalance = current.data?.points_balance ?? 0;
    const delta = points - currentBalance;
    if (delta !== 0) {
      const { error } = await promotedAdmin.client.rpc("admin_adjust_loyalty_points", {
        p_profile_id: owner.id,
        p_points: delta,
        p_reason: "vitest fixture setup",
      });
      if (error) throw new Error(`setAvailableBalance(${points}) failed: ${error.message}`);
    }
  }

  async function getAccount() {
    const { data, error } = await admin.from("loyalty_accounts").select("*").eq("profile_id", owner.id).single();
    if (error) throw error;
    return data;
  }

  beforeAll(async () => {
    owner = await createTestUser(admin, "redeem-owner");
    promotedAdmin = await createTestUser(admin, "redeem-admin");
    const promote = await admin.from("profiles").update({ role: "admin" }).eq("id", promotedAdmin.id);
    if (promote.error) throw promote.error;

    const settings = await admin.from("loyalty_settings").select("*").eq("id", 1).single();
    if (settings.error) throw settings.error;
    loyaltyWasEnabled = settings.data.is_enabled;
    spendThreshold = settings.data.spend_threshold;
    redemptionUnit = settings.data.redemption_points_unit;
    redemptionValuePerUnit = settings.data.points_redemption_value;
    minRedeemablePoints = settings.data.min_redeemable_points;
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
    const zone = (area.data as unknown as { delivery_zones: { delivery_fee: number; min_order_amount: number | null } }).delivery_zones;
    deliveryFee = zone.delivery_fee;
    const minOrderAmount = zone.min_order_amount;

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

    // Eligible for at least 1 points_per_threshold award (so pending-points
    // tests have something to earn) and clears the zone minimum -- both
    // real, existing configs.
    const minForPoints = Math.ceil(spendThreshold / productPrice) + 1;
    const minForZone = minOrderAmount ? Math.ceil(minOrderAmount / productPrice) + 1 : 1;
    eligibleQuantity = Math.max(minForPoints, minForZone);

    const address = await owner.client
      .from("addresses")
      .insert({
        profile_id: owner.id,
        recipient_name: "Vitest Redemption",
        phone: "01000000006",
        delivery_area_id: activeAreaId,
        detailed_address: "Integration test redemption address",
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
    await admin.from("loyalty_settings").update({ min_redeemable_points: minRedeemablePoints } as never).eq("id", 1);
    await deleteTestUser(admin, owner.id);
    await deleteTestUser(admin, promotedAdmin.id);
  });

  beforeEach(async () => {
    // Every test starts from a clean, known available balance -- see
    // setAvailableBalance()'s doc comment.
    await setAvailableBalance(0);
    await admin.from("loyalty_settings").update({ min_redeemable_points: null } as never).eq("id", 1);
    await admin.from("loyalty_settings").update({ is_enabled: true }).eq("id", 1);
  });

  it("TEST 1: redeems 100 available points for the configured value (100 -> 10 EGP)", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await cartWithProduct();
    const { data: order, error } = await placeOrder(cartId, redemptionUnit);
    expect(error).toBeNull();
    try {
      const expectedDiscount = (redemptionUnit / redemptionUnit) * redemptionValuePerUnit;
      expect(Number(order!.discount_amount)).toBe(expectedDiscount);
      expect(order!.loyalty_points_redeemed).toBe(redemptionUnit);
      expect(Number(order!.total)).toBe(Number(order!.subtotal) + Number(order!.delivery_fee) - expectedDiscount);

      const account = await getAccount();
      expect(account.points_balance).toBe(0);
    } finally {
      await wipeOrder(order!.id);
    }
  });

  it("TEST 2: redeems 200 available points for double the value (200 -> 20 EGP)", async () => {
    const twoBlocks = redemptionUnit * 2;
    await setAvailableBalance(twoBlocks);
    const cartId = await cartWithProduct();
    const { data: order, error } = await placeOrder(cartId, twoBlocks);
    expect(error).toBeNull();
    try {
      const expectedDiscount = 2 * redemptionValuePerUnit;
      expect(Number(order!.discount_amount)).toBe(expectedDiscount);
      expect(order!.loyalty_points_redeemed).toBe(twoBlocks);

      const account = await getAccount();
      expect(account.points_balance).toBe(0);
    } finally {
      await wipeOrder(order!.id);
    }
  });

  it("TEST 3: with 250 points, only the 200-point block is redeemable -- 250 itself is rejected, 200 succeeds and 50 remain", async () => {
    const balance = redemptionUnit * 2 + Math.floor(redemptionUnit / 2); // e.g. 250 when unit=100
    const blockMax = redemptionUnit * 2; // 200
    await setAvailableBalance(balance);

    // A literal non-multiple redemption request is rejected outright, not
    // silently rounded down -- the block size is enforced server-side.
    const badCartId = await cartWithProduct();
    const bad = await placeOrder(badCartId, balance);
    expect(bad.error?.message).toMatch(/blocks of/i);
    await admin.from("carts").delete().eq("id", badCartId);

    const cartId = await cartWithProduct();
    const { data: order, error } = await placeOrder(cartId, blockMax);
    expect(error).toBeNull();
    try {
      expect(order!.loyalty_points_redeemed).toBe(blockMax);
      const account = await getAccount();
      expect(account.points_balance).toBe(balance - blockMax); // 50 remain
    } finally {
      await wipeOrder(order!.id);
    }
  });

  it("TEST 4 / 10: below one full block (99 points) cannot redeem even the smallest block", async () => {
    await setAvailableBalance(redemptionUnit - 1); // e.g. 99
    const cartId = await cartWithProduct();
    const { error } = await placeOrder(cartId, redemptionUnit);
    expect(error?.message).toMatch(/insufficient loyalty points balance/i);
    await admin.from("carts").delete().eq("id", cartId);

    const account = await getAccount();
    expect(account.points_balance).toBe(redemptionUnit - 1);
  });

  it("TEST 5: PENDING points can never be redeemed, only points_balance counts", async () => {
    // Earn PENDING points via a real (undelivered) order -- points_balance
    // stays 0 the whole time.
    const earnCartId = await cartWithProduct();
    const { data: earnOrder, error: earnError } = await placeOrder(earnCartId, 0);
    expect(earnError).toBeNull();
    try {
      const account = await getAccount();
      expect(account.pending_points_balance).toBeGreaterThan(0);
      expect(account.points_balance).toBe(0);

      const redeemCartId = await cartWithProduct();
      const { error } = await placeOrder(redeemCartId, redemptionUnit);
      expect(error?.message).toMatch(/insufficient loyalty points balance/i);
      await admin.from("carts").delete().eq("id", redeemCartId);
    } finally {
      await wipeOrder(earnOrder!.id);
    }
  });

  it("TEST 6 / 9: available balance decreases correctly and the final total is correct", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await cartWithProduct();
    const { data: order, error } = await placeOrder(cartId, redemptionUnit);
    expect(error).toBeNull();
    try {
      const account = await getAccount();
      expect(account.points_balance).toBe(0);

      const expectedDiscount = redemptionValuePerUnit;
      const expectedTotal = Number(order!.subtotal) + Number(order!.delivery_fee) - expectedDiscount;
      expect(Number(order!.total)).toBe(expectedTotal);
      expect(Number(order!.delivery_fee)).toBe(deliveryFee);
    } finally {
      await wipeOrder(order!.id);
    }
  });

  it("TEST 7: a REDEEMED loyalty_transaction is created with the correct linkage", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await cartWithProduct();
    const { data: order, error } = await placeOrder(cartId, redemptionUnit);
    expect(error).toBeNull();
    try {
      const tx = await admin.from("loyalty_transactions").select("*").eq("order_id", order!.id).eq("type", "REDEEMED").single();
      expect(tx.data?.points).toBe(-redemptionUnit);
      expect(tx.data?.balance_after).toBe(0);
      expect(tx.data?.status).toBe("AVAILABLE"); // REDEEMED is always an immediate, settled transaction
      expect(tx.data?.reason).toMatch(/redeemed at checkout/i);
    } finally {
      await wipeOrder(order!.id);
    }
  });

  it("TEST 8: the order stores the correct loyalty discount and redeemed points", async () => {
    const twoBlocks = redemptionUnit * 2;
    await setAvailableBalance(twoBlocks);
    const cartId = await cartWithProduct();
    const { data: order, error } = await placeOrder(cartId, twoBlocks);
    expect(error).toBeNull();
    try {
      const stored = await admin.from("orders").select("discount_amount, loyalty_points_redeemed").eq("id", order!.id).single();
      expect(Number(stored.data?.discount_amount)).toBe(2 * redemptionValuePerUnit);
      expect(stored.data?.loyalty_points_redeemed).toBe(twoBlocks);
    } finally {
      await wipeOrder(order!.id);
    }
  });

  it("TEST 11: the client has no discount-amount parameter to manipulate -- only p_redeem_points exists, and the server always recomputes the discount from it", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await cartWithProduct();
    // create_order() accepts no discount/total argument at all -- passing
    // extra unknown parameters is simply not possible via supabase-js's
    // typed rpc() call, and even a raw REST call would have them ignored
    // by PostgREST's function-argument matching. The only lever is
    // p_redeem_points, and the resulting discount is always
    // (points / unit) * value from the server's own loyalty_settings.
    const { data: order, error } = await placeOrder(cartId, redemptionUnit);
    expect(error).toBeNull();
    try {
      expect(Number(order!.discount_amount)).toBe(redemptionValuePerUnit);
    } finally {
      await wipeOrder(order!.id);
    }
  });

  it("TEST 12: cannot redeem more points than available", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await cartWithProduct();
    const { error } = await placeOrder(cartId, redemptionUnit * 5);
    expect(error?.message).toMatch(/insufficient loyalty points balance/i);
    await admin.from("carts").delete().eq("id", cartId);

    const account = await getAccount();
    expect(account.points_balance).toBe(redemptionUnit); // untouched
  });

  it("TEST 13: a failed order creation (unrelated failure) never consumes points", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await freshCart(); // deliberately empty cart -> 'Cart is empty'
    const { error } = await placeOrder(cartId, redemptionUnit);
    expect(error?.message).toMatch(/cart is empty/i);

    const account = await getAccount();
    expect(account.points_balance).toBe(redemptionUnit); // unchanged -- the whole function rolled back
  });

  it("TEST 14: a sequential retry on the same cart cannot redeem the same points twice", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await cartWithProduct();

    const first = await placeOrder(cartId, redemptionUnit);
    expect(first.error).toBeNull();
    try {
      const retry = await placeOrder(cartId, redemptionUnit);
      expect(retry.error?.message).toMatch(/cart is not active/i);

      const account = await getAccount();
      expect(account.points_balance).toBe(0); // redeemed exactly once, not twice
    } finally {
      await wipeOrder(first.data!.id);
    }
  });

  it("TEST 15: two concurrent create_order calls on the same cart cannot overspend the balance", async () => {
    await setAvailableBalance(redemptionUnit);
    const cartId = await cartWithProduct();

    const [a, b] = await Promise.all([placeOrder(cartId, redemptionUnit), placeOrder(cartId, redemptionUnit)]);
    const results = [a, b];
    const succeeded = results.filter((r) => r.error === null);
    const failed = results.filter((r) => r.error !== null);

    // The `for update` lock on the cart row serializes these instead of
    // letting both pass the "cart is active" check -- exactly one must win.
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(failed[0].error?.message).toMatch(/cart is not active/i);

    const account = await getAccount();
    expect(account.points_balance).toBe(0); // redeemed exactly once, never overspent to -100

    await wipeOrder(succeeded[0].data!.id);
  });

  it("TEST 16: loyalty disabled -> redemption unavailable and no points are consumed", async () => {
    await setAvailableBalance(redemptionUnit);
    await admin.from("loyalty_settings").update({ is_enabled: false }).eq("id", 1);
    try {
      const cartId = await cartWithProduct();
      const { error } = await placeOrder(cartId, redemptionUnit);
      expect(error?.message).toMatch(/loyalty program is not currently enabled/i);
      await admin.from("carts").delete().eq("id", cartId);

      const account = await getAccount();
      expect(account.points_balance).toBe(redemptionUnit);
    } finally {
      await admin.from("loyalty_settings").update({ is_enabled: true }).eq("id", 1);
    }
  });
});
