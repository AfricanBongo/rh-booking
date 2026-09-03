import { describe, it, expect } from "vitest";
import { additionalGuestSchema, additionalGuestsSchema } from "./children";

describe("additionalGuestSchema", () => {
  it("valid: age 5, no dining pass", () => {
    const result = additionalGuestSchema.safeParse({ age: 5, diningPassId: null });
    expect(result.success).toBe(true);
  });

  it("valid: age 14, with dining pass", () => {
    const result = additionalGuestSchema.safeParse({ age: 14, diningPassId: "abc123" });
    expect(result.success).toBe(true);
  });

  it("invalid: age 0", () => {
    const result = additionalGuestSchema.safeParse({ age: 0, diningPassId: null });
    expect(result.success).toBe(false);
  });

  it("invalid: age 18", () => {
    const result = additionalGuestSchema.safeParse({ age: 18, diningPassId: null });
    expect(result.success).toBe(false);
  });
});

describe("additionalGuestsSchema", () => {
  it("valid: array of guests", () => {
    const result = additionalGuestsSchema.safeParse([
      { age: 5, diningPassId: null },
      { age: 14, diningPassId: "abc" },
    ]);
    expect(result.success).toBe(true);
  });
});
