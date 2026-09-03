import { describe, it, expect } from "vitest";
import { calculateRoomAvailability } from "./price";

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
