import { describe, it, expect } from "vitest";
import { validateGenderSharing } from "./gender-validation";

describe("validateGenderSharing", () => {
  it("male invites male: allowed (no relationship needed)", () => {
    expect(validateGenderSharing("male", "male")).toEqual({ allowed: true });
  });

  it("female invites female: allowed", () => {
    expect(validateGenderSharing("female", "female")).toEqual({ allowed: true });
  });

  it("male invites female + married: allowed", () => {
    expect(validateGenderSharing("male", "female", "married")).toEqual({ allowed: true });
  });

  it("male invites female + siblings: allowed", () => {
    expect(validateGenderSharing("male", "female", "siblings")).toEqual({ allowed: true });
  });

  it("male invites female + neither: blocked", () => {
    expect(validateGenderSharing("male", "female", "none")).toEqual({
      allowed: false,
      reason: "Opposite genders cannot share unless married or siblings",
    });
  });

  it("female invites male + neither: blocked", () => {
    expect(validateGenderSharing("female", "male", "none")).toEqual({
      allowed: false,
      reason: "Opposite genders cannot share unless married or siblings",
    });
  });

  it("opposite genders without relationship specified: requires relationship", () => {
    expect(validateGenderSharing("male", "female")).toEqual({
      allowed: false,
      reason: "Relationship required for opposite gender sharing",
      requiresRelationship: true,
    });
  });
});
