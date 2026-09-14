import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, serviceClient, type TestUser } from "./helpers";

describe("RLS cross-customer isolation (live Supabase project)", () => {
  const admin = serviceClient();
  let userA: TestUser;
  let userB: TestUser;
  let addressId: string;

  beforeAll(async () => {
    userA = await createTestUser(admin, "rls-a");
    userB = await createTestUser(admin, "rls-b");

    const { data, error } = await userA.client
      .from("addresses")
      .insert({
        profile_id: userA.id,
        recipient_name: "Vitest A",
        phone: "01000000001",
        delivery_area_id: (await admin.from("delivery_areas").select("id").eq("is_active", true).limit(1).single())
          .data!.id,
        detailed_address: "Integration test address",
      })
      .select("id")
      .single();
    if (error) throw error;
    addressId = data.id;
  });

  afterAll(async () => {
    await deleteTestUser(admin, userA.id);
    await deleteTestUser(admin, userB.id);
  });

  it("lets a customer read their own address", async () => {
    const { data, error } = await userA.client.from("addresses").select("id").eq("id", addressId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(addressId);
  });

  it("hides another customer's address entirely (RLS filters, not an error)", async () => {
    const { data, error } = await userB.client.from("addresses").select("id").eq("id", addressId).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("silently no-ops an update to another customer's address instead of applying it", async () => {
    const { error } = await userB.client.from("addresses").update({ recipient_name: "Hijacked" }).eq("id", addressId);
    expect(error).toBeNull(); // RLS filters the row out of the UPDATE's WHERE, not an error

    const { data } = await admin.from("addresses").select("recipient_name").eq("id", addressId).single();
    expect(data?.recipient_name).toBe("Vitest A");
  });

  it("blocks a plain customer from calling admin_set_profile_role on themselves", async () => {
    const { error } = await userA.client.rpc("admin_set_profile_role", {
      p_profile_id: userA.id,
      p_new_role: "admin",
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/only an admin/i);

    const { data: profile } = await admin.from("profiles").select("role").eq("id", userA.id).single();
    expect(profile?.role).toBe("customer");
  });

  it("blocks a plain customer from directly updating their own role column", async () => {
    // profiles_update_own exists, but the `role` column is revoked from
    // `authenticated` at the grant level (migration 0002) -- this must
    // fail, not silently succeed.
    const { error } = await userA.client.from("profiles").update({ role: "admin" }).eq("id", userA.id);
    expect(error).not.toBeNull();

    const { data: profile } = await admin.from("profiles").select("role").eq("id", userA.id).single();
    expect(profile?.role).toBe("customer");
  });
});
