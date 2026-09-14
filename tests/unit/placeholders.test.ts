import { describe, expect, it } from "vitest";
import { categoryPlaceholderKey, placeholderImage } from "@/lib/media/placeholders";

describe("categoryPlaceholderKey", () => {
  it("maps real category slugs to a matching photo keyword set", () => {
    expect(categoryPlaceholderKey("fresh-chicken")).toBe("chicken");
    expect(categoryPlaceholderKey("fresh-fruits")).toBe("fruits");
    expect(categoryPlaceholderKey("fresh-vegetables")).toBe("vegetables");
    expect(categoryPlaceholderKey("prepared-fruits")).toBe("fruits");
    expect(categoryPlaceholderKey("prepared-vegetables")).toBe("vegetables");
    expect(categoryPlaceholderKey("green-box-boxes")).toBe("greenBox");
  });

  it("falls back to a neutral key for an unknown or missing category, never a wrong specific one", () => {
    expect(categoryPlaceholderKey("some-future-category")).toBe("grocery");
    expect(categoryPlaceholderKey(null)).toBe("grocery");
    expect(categoryPlaceholderKey(undefined)).toBe("grocery");
  });
});

describe("placeholderImage", () => {
  it("is deterministic: the same key and variant always produce the same URL", () => {
    const a = placeholderImage("chicken", { variant: 2 });
    const b = placeholderImage("chicken", { variant: 2 });
    expect(a).toBe(b);
  });

  it("varies by key so different categories don't collide on the same lock", () => {
    expect(placeholderImage("chicken")).not.toBe(placeholderImage("fruits"));
  });
});
