import { describe, it, expect } from "vitest";
import { createBookingSchema } from "./booking";

const CONF_START = "2026-08-01";
const CONF_END = "2026-08-05";

const schema = createBookingSchema(CONF_START, CONF_END);

describe("createBookingSchema", () => {
  it("accepts check_in before check_out within conference dates", () => {
    const result = schema.safeParse({ check_in: "2026-08-02", check_out: "2026-08-04" });
    expect(result.success).toBe(true);
  });

  it("rejects check_in after check_out", () => {
    const result = schema.safeParse({ check_in: "2026-08-04", check_out: "2026-08-02" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i: { path: PropertyKey[] }) => i.path.map(String).join("."));
      expect(paths).toContain("check_out");
    }
  });

  it("rejects check_in before conference start minus 1 day", () => {
    const result = schema.safeParse({ check_in: "2026-07-30", check_out: "2026-08-03" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i: { path: PropertyKey[] }) => i.path.map(String).join("."));
      expect(paths).toContain("check_in");
    }
  });

  it("rejects check_out after conference end", () => {
    const result = schema.safeParse({ check_in: "2026-08-02", check_out: "2026-08-06" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i: { path: PropertyKey[] }) => i.path.map(String).join("."));
      expect(paths).toContain("check_out");
    }
  });

  it("accepts check_in equal to conference start", () => {
    const result = schema.safeParse({ check_in: "2026-08-01", check_out: "2026-08-03" });
    expect(result.success).toBe(true);
  });

  it("accepts check_out equal to conference end", () => {
    const result = schema.safeParse({ check_in: "2026-08-02", check_out: "2026-08-05" });
    expect(result.success).toBe(true);
  });
});
