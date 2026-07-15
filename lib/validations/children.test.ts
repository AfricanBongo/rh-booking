import { describe, it, expect } from "vitest";
import { childSchema, childrenSchema } from "./children";

describe("childSchema", () => {
  it("valid child (age 5, male): passes", () => {
    const result = childSchema.safeParse({ age: 5, gender: "male" });
    expect(result.success).toBe(true);
  });

  it("valid child (age 17, female): passes", () => {
    const result = childSchema.safeParse({ age: 17, gender: "female" });
    expect(result.success).toBe(true);
  });

  it("age 0: fails", () => {
    const result = childSchema.safeParse({ age: 0, gender: "male" });
    expect(result.success).toBe(false);
  });

  it("missing gender: fails", () => {
    const result = childSchema.safeParse({ age: 5 });
    expect(result.success).toBe(false);
  });

  it("age 18: fails", () => {
    const result = childSchema.safeParse({ age: 18, gender: "male" });
    expect(result.success).toBe(false);
  });
});

describe("childrenSchema", () => {
  it("empty array: valid", () => {
    const result = childrenSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("array with valid children: valid", () => {
    const result = childrenSchema.safeParse([
      { age: 5, gender: "male" },
      { age: 14, gender: "female" },
    ]);
    expect(result.success).toBe(true);
  });

  it("array with invalid child: fails", () => {
    const result = childrenSchema.safeParse([
      { age: 5, gender: "male" },
      { age: 0, gender: "female" },
    ]);
    expect(result.success).toBe(false);
  });
});
