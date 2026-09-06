import { describe, it, expect } from "vitest";
import { calculateGuestSurcharge } from "./children";

describe("calculateGuestSurcharge", () => {
  it("always returns 0 (surcharges removed)", () => {
    expect(calculateGuestSurcharge()).toBe(0);
  });
});
