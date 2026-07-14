import { describe, it, expect } from "vitest";
import { MIN_PAYMENT_AMOUNT } from "@/lib/constants";

describe("constants", () => {
  it("has correct minimum payment amount", () => {
    expect(MIN_PAYMENT_AMOUNT).toBe(2500);
  });
});
