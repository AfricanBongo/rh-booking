import { vi, describe, it, expect, beforeEach } from "vitest";
vi.mock("@/lib/strapi");
import { strapiGet } from "@/lib/strapi";
import { getDiningPassesForConference } from "./dining-passes";

const mockGet = vi.mocked(strapiGet);

const item = {
  id: 1,
  documentId: "dp-abc",
  name: "Full Dining Pass",
  description: "All meals included",
  price: 12000,
  meals_covered: 6,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getDiningPassesForConference mapping", () => {
  it("maps meals_covered to mealsCovered", async () => {
    mockGet.mockResolvedValue({ data: [item], meta: {} });
    const [pass] = await getDiningPassesForConference("conf-1");
    expect(pass.mealsCovered).toBe(6);
  });

  it("maps documentId to id", async () => {
    mockGet.mockResolvedValue({ data: [item], meta: {} });
    const [pass] = await getDiningPassesForConference("conf-1");
    expect(pass.id).toBe("dp-abc");
  });

  it("returns [] when strapiGet throws", async () => {
    mockGet.mockRejectedValue(new Error("network error"));
    const result = await getDiningPassesForConference("conf-1");
    expect(result).toEqual([]);
  });
});
