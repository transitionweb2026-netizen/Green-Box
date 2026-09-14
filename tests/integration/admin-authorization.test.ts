import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, serviceClient, type TestUser } from "./helpers";

describe("Admin authorization boundaries (live Supabase project)", () => {
  const admin = serviceClient();
  let customer: TestUser;
  let promotedAdmin: TestUser;

  beforeAll(async () => {
    customer = await createTestUser(admin, "admin-auth-customer");
    promotedAdmin = await createTestUser(admin, "admin-auth-admin");
    // Promote via the service client directly (bypassing RLS on purpose,
    // as a fixture-setup step) so the test doesn't depend on
    // admin_set_profile_role, which is exercised separately below.
    const { error } = await admin.from("profiles").update({ role: "admin" }).eq("id", promotedAdmin.id);
    if (error) throw error;
  });

  afterAll(async () => {
    await deleteTestUser(admin, customer.id);
    await deleteTestUser(admin, promotedAdmin.id);
  });

  it("blocks a plain customer from creating a product directly (RLS admin_all)", async () => {
    const category = await admin.from("categories").select("id").limit(1).single();
    const { error } = await customer.client.from("products").insert({
      category_id: category.data!.id,
      product_type: "standard",
      slug: `vitest-blocked-${Date.now()}`,
      name_ar: "منتج محظور",
      price: 10,
    });
    expect(error).not.toBeNull();
  });

  it("lets a real admin create and then remove a product", async () => {
    const category = await admin.from("categories").select("id").limit(1).single();
    const slug = `vitest-admin-created-${Date.now()}`;
    const { data, error } = await promotedAdmin.client
      .from("products")
      .insert({ category_id: category.data!.id, product_type: "standard", slug, name_ar: "منتج تجريبي", price: 15 })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeDefined();

    if (data) {
      const del = await promotedAdmin.client.from("products").delete().eq("id", data.id);
      expect(del.error).toBeNull();
    }
  });

  it("blocks a plain customer from verifying a payment via the trusted function", async () => {
    // record_payment_verification requires an admin; passing a random uuid
    // is enough to prove the auth check fires before the "not found" check
    // would even matter, since is_admin() is the very first thing it does.
    const { error } = await customer.client.rpc("record_payment_verification", {
      p_payment_id: "00000000-0000-0000-0000-000000000000",
      p_new_status: "VERIFIED",
    });
    expect(error?.message).toMatch(/only an admin/i);
  });

  it("prevents demoting the last remaining administrator", async () => {
    // Temporarily makes promotedAdmin the *only* admin by demoting every
    // other admin, calls the guard, then restores -- wrapped in
    // try/finally so a real admin account is never left demoted even if
    // an assertion here fails.
    const { data: otherAdmins } = await admin.from("profiles").select("id").eq("role", "admin").neq("id", promotedAdmin.id);
    try {
      for (const other of otherAdmins ?? []) {
        await admin.from("profiles").update({ role: "customer" }).eq("id", other.id);
      }

      const { error } = await promotedAdmin.client.rpc("admin_set_profile_role", {
        p_profile_id: promotedAdmin.id,
        p_new_role: "customer",
      });
      expect(error?.message).toMatch(/last administrator/i);
    } finally {
      for (const other of otherAdmins ?? []) {
        await admin.from("profiles").update({ role: "admin" }).eq("id", other.id);
      }
    }
  });
});
