import { describe, it, expect } from "vitest";
import { validatePaymentAmount } from "./payment";

describe("validatePaymentAmount", () => {
  it("$25 (2500 cents) with $150 remaining: valid", () => {
    const result = validatePaymentAmount(2500, 15000);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(2500);
  });

  it("$24 (2400 cents): invalid (below minimum)", () => {
    const result = validatePaymentAmount(2400, 15000);
    expect(result.success).toBe(false);
  });

  it("$151 (15100 cents) with $150 remaining: invalid (exceeds remaining)", () => {
    const result = validatePaymentAmount(15100, 15000);
    expect(result.success).toBe(false);
  });

  it("$150 (15000 cents) with $150 remaining: valid (exact remaining)", () => {
    const result = validatePaymentAmount(15000, 15000);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(15000);
  });

  it("$0: invalid", () => {
    const result = validatePaymentAmount(0, 15000);
    expect(result.success).toBe(false);
  });

  it("negative amount: invalid", () => {
    const result = validatePaymentAmount(-500, 15000);
    expect(result.success).toBe(false);
  });
});
