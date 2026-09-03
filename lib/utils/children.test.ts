import { describe, it, expect } from "vitest";
import { calculateGuestSurcharge } from "./children";

describe("calculateGuestSurcharge", () => {
  it("0 guests: $0 surcharge", () => {
    expect(calculateGuestSurcharge([], 15000)).toBe(0);
  });

  it("1 guest age 8: $0 surcharge", () => {
    expect(calculateGuestSurcharge([{ age: 8 }], 15000)).toBe(0);
  });

  it("1 guest age 14: surcharge = per_person_rate", () => {
    expect(calculateGuestSurcharge([{ age: 14 }], 15000)).toBe(15000);
  });

  it("2 guests (age 8, age 15): surcharge = 1 * per_person_rate", () => {
    expect(calculateGuestSurcharge([{ age: 8 }, { age: 15 }], 15000)).toBe(15000);
  });

  it("3 guests (age 12, 13, 14): surcharge = 3 * per_person_rate", () => {
    expect(calculateGuestSurcharge([{ age: 12 }, { age: 13 }, { age: 14 }], 7500)).toBe(22500);
  });
});
