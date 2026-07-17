import { describe, it, expect } from "vitest";
import { calculatePerPersonPrice, calculateRoomAvailability } from "./price";

describe("calculatePerPersonPrice", () => {
  it("private $300 -> $300/person", () => {
    expect(calculatePerPersonPrice(30000, 1)).toBe(30000);
  });

  it("shared-2 $300 -> $150/person", () => {
    expect(calculatePerPersonPrice(30000, 2)).toBe(15000);
  });

  it("shared-4 $300 -> $75/person", () => {
    expect(calculatePerPersonPrice(30000, 4)).toBe(7500);
  });

  it("handles odd divisions (rounds to nearest cent)", () => {
    expect(calculatePerPersonPrice(10000, 3)).toBe(3333);
  });
});

describe("calculateRoomAvailability", () => {
  it("10 total, 3 booked = 7 remaining", () => {
    expect(calculateRoomAvailability(10, 3)).toBe(7);
  });

  it("10 total, 10 booked = 0 remaining (sold out)", () => {
    expect(calculateRoomAvailability(10, 10)).toBe(0);
  });

  it("10 total, 0 booked = 10 remaining", () => {
    expect(calculateRoomAvailability(10, 0)).toBe(10);
  });
});
