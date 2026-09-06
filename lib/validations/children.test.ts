import { describe, it, expect } from "vitest";
import { additionalGuestSchema, additionalGuestsSchema } from "./children";

describe("additionalGuestSchema", () => {
  it("valid: age 0 (newborn)", () => {
    const result = additionalGuestSchema.safeParse({ age: 0 });
    expect(result.success).toBe(true);
  });

  it("valid: age 5", () => {
    const result = additionalGuestSchema.safeParse({ age: 5 });
    expect(result.success).toBe(true);
  });

  it("valid: age 25 (adult child)", () => {
    const result = additionalGuestSchema.safeParse({ age: 25 });
    expect(result.success).toBe(true);
  });

  it("valid: age 99", () => {
    const result = additionalGuestSchema.safeParse({ age: 99 });
    expect(result.success).toBe(true);
  });

  it("invalid: age -1", () => {
    const result = additionalGuestSchema.safeParse({ age: -1 });
    expect(result.success).toBe(false);
  });

  it("invalid: age 100", () => {
    const result = additionalGuestSchema.safeParse({ age: 100 });
    expect(result.success).toBe(false);
  });
});

describe("additionalGuestsSchema", () => {
  it("valid: array of children", () => {
    const result = additionalGuestsSchema.safeParse([{ age: 5 }, { age: 14 }]);
    expect(result.success).toBe(true);
  });
});
