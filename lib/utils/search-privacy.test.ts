import { describe, it, expect } from "vitest";
import { applySearchPrivacy, detectSearchType } from "./search-privacy";

describe("detectSearchType", () => {
  it("all digits = phone search", () => {
    expect(detectSearchType("4045551234")).toBe("phone");
  });

  it("digits with spaces/dashes = phone search", () => {
    expect(detectSearchType("404-555-1234")).toBe("phone");
  });

  it("letters present = name search", () => {
    expect(detectSearchType("Jane")).toBe("name");
  });

  it("mixed alphanumeric = name search", () => {
    expect(detectSearchType("Jane2")).toBe("name");
  });
});

describe("applySearchPrivacy", () => {
  const profile = {
    id: "user-1",
    fullName: "Jane Doe",
    phone: "404-555-1234",
    gender: "female" as const,
  };

  it("name search: shows name + phone", () => {
    const result = applySearchPrivacy(profile, "name");
    expect(result.fullName).toBe("Jane Doe");
    expect(result.phone).toBe("404-555-1234");
  });

  it("phone search: shows name only, hides phone", () => {
    const result = applySearchPrivacy(profile, "phone");
    expect(result.fullName).toBe("Jane Doe");
    expect(result.phone).toBeNull();
  });
});
