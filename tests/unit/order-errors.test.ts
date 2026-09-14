import { describe, expect, it } from "vitest";
import { classifyOrderError } from "@/lib/errors/order-errors";

describe("classifyOrderError", () => {
  it("maps exact create_order exception messages to stable codes", () => {
    expect(classifyOrderError("This delivery slot is fully booked for the selected date").code).toBe("SLOT_FULL");
    expect(classifyOrderError("Order subtotal is below the minimum order amount for this zone").code).toBe(
      "MIN_ORDER_NOT_MET",
    );
    expect(classifyOrderError("Insufficient loyalty points balance").code).toBe("LOYALTY_INSUFFICIENT");
    expect(classifyOrderError("Delivery date cannot be in the past").code).toBe("INVALID_DATE");
  });

  it("extracts the product name from the dynamic 'no longer available' message", () => {
    const result = classifyOrderError("Product طماطم is no longer available");
    expect(result.code).toBe("PRODUCT_UNAVAILABLE");
    expect(result.productName).toBe("طماطم");
  });

  it("extracts the product name from the dynamic reservation lead-time message", () => {
    const result = classifyOrderError("Product خيار requires at least 1 day(s) advance reservation");
    expect(result.code).toBe("RESERVATION_LEAD_TIME");
    expect(result.productName).toBe("خيار");
  });

  it("falls back to GENERIC for unknown or undefined messages", () => {
    expect(classifyOrderError("some never-before-seen postgres error").code).toBe("GENERIC");
    expect(classifyOrderError(undefined).code).toBe("GENERIC");
  });
});
