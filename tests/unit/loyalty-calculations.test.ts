import { describe, expect, it } from "vitest";
import { calculateRedemptionValue } from "@/lib/loyalty/calculations";
import type { Tables } from "@/types/database";

function settings(overrides: Partial<Tables<"loyalty_settings">> = {}): Tables<"loyalty_settings"> {
  return {
    id: 1,
    is_enabled: true,
    spend_threshold: 1000,
    points_per_threshold: 100,
    redemption_points_unit: 100,
    points_redemption_value: 10,
    min_redeemable_points: 100,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("calculateRedemptionValue", () => {
  it("matches the documented rate: every 100 points = 10 EGP", () => {
    expect(calculateRedemptionValue(100, settings())).toBe(10);
    expect(calculateRedemptionValue(500, settings())).toBe(50);
  });

  it("returns 0 for zero or negative points instead of a negative discount", () => {
    expect(calculateRedemptionValue(0, settings())).toBe(0);
    expect(calculateRedemptionValue(-50, settings())).toBe(0);
  });

  it("respects a different configured redemption rate", () => {
    // 1 point = 1 EGP under this configuration
    expect(calculateRedemptionValue(250, settings({ redemption_points_unit: 1, points_redemption_value: 1 }))).toBe(
      250,
    );
  });
});
