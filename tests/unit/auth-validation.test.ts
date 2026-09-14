import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    fullName: "Test User",
    email: "a@b.com",
    phone: "01000000000",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts matching passwords", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched passwords with the PASSWORD_MISMATCH marker", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "PASSWORD_MISMATCH")).toBe(true);
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(registerSchema.safeParse({ ...base, password: "short", confirmPassword: "short" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching passwords of sufficient length", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "newpassword1", confirmPassword: "newpassword1" }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({ password: "newpassword1", confirmPassword: "different1" }).success,
    ).toBe(false);
  });
});
