import type { Tables } from "@/types/database";

/**
 * Pure calculation, deliberately kept out of lib/services/loyalty.ts
 * (which is "server-only" and touches the database) so Client Components
 * -- e.g. the live redemption preview on the checkout form -- can import
 * it without pulling server-only code into the browser bundle.
 */
export function calculateRedemptionValue(points: number, settings: Tables<"loyalty_settings">): number {
  if (points <= 0) return 0;
  return (points / settings.redemption_points_unit) * settings.points_redemption_value;
}
