import { describe, it, expect } from "vitest";
import { calculateChildrenSurcharge } from "./children";

describe("calculateChildrenSurcharge", () => {
  it("0 children: $0 surcharge", () => {
    expect(calculateChildrenSurcharge([], 15000)).toBe(0);
  });

  it("1 child age 8: $0 surcharge", () => {
    expect(calculateChildrenSurcharge([{ age: 8, gender: "male" }], 15000)).toBe(0);
  });

  it("1 child age 14: surcharge = per_person_rate", () => {
    expect(calculateChildrenSurcharge([{ age: 14, gender: "female" }], 15000)).toBe(15000);
  });

  it("2 children (age 8, age 15): surcharge = 1 * per_person_rate", () => {
    expect(
      calculateChildrenSurcharge(
        [
          { age: 8, gender: "male" },
          { age: 15, gender: "female" },
        ],
        15000
      )
    ).toBe(15000);
  });

  it("3 children (age 12, 13, 14): surcharge = 3 * per_person_rate", () => {
    expect(
      calculateChildrenSurcharge(
        [
          { age: 12, gender: "male" },
          { age: 13, gender: "female" },
          { age: 14, gender: "male" },
        ],
        7500
      )
    ).toBe(22500);
  });
});
