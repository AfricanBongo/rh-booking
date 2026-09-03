import { vi, describe, it, expect, beforeEach } from "vitest";
vi.mock("@/lib/strapi");
import { strapiGet } from "@/lib/strapi";
import { getConferences } from "./conferences";

const mockGet = vi.mocked(strapiGet);

const item = {
  id: 1,
  documentId: "abc123",
  slug: "test-2026",
  name: "Test Conference 2026",
  description: "Great event",
  start_date: "2026-11-26T21:00:00.000Z",
  end_date: "2026-11-28T17:00:00.000Z",
  check_in: "2026-11-26T21:00:00.000Z",
  check_out: "2026-11-28T17:00:00.000Z",
  payment_deadline: "2026-10-15T15:59:00.000Z",
  location: "Atlanta, GA",
  is_active: true,
  image: { url: "https://cdn.example.com/img.jpg", formats: {} },
  portrait_image: { url: "/uploads/portrait.jpg" },
  other_images: [
    { url: "/uploads/g1.jpg" },
    { url: "https://cdn.example.com/g2.jpg" },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  process.env.NEXT_PUBLIC_STRAPI_URL = "https://cms.test";
});

describe("getConferences mapping", () => {
  it("maps documentId to id, name, slug, location, isActive", async () => {
    mockGet.mockResolvedValue({ data: [item], meta: {} });
    const [conf] = await getConferences();
    expect(conf.id).toBe("abc123");
    expect(conf.name).toBe("Test Conference 2026");
    expect(conf.slug).toBe("test-2026");
    expect(conf.location).toBe("Atlanta, GA");
    expect(conf.isActive).toBe(true);
  });

  it("imageUrl with absolute URL stays unchanged", async () => {
    mockGet.mockResolvedValue({ data: [item], meta: {} });
    const [conf] = await getConferences();
    expect(conf.imageUrl).toBe("https://cdn.example.com/img.jpg");
  });

  it("portraitImageUrl with relative path gets STRAPI_URL prefix", async () => {
    mockGet.mockResolvedValue({ data: [item], meta: {} });
    const [conf] = await getConferences();
    expect(conf.portraitImageUrl).toBe("https://cms.test/uploads/portrait.jpg");
  });

  it("otherImageUrls resolves relative and keeps absolute", async () => {
    mockGet.mockResolvedValue({ data: [item], meta: {} });
    const [conf] = await getConferences();
    expect(conf.otherImageUrls).toEqual([
      "https://cms.test/uploads/g1.jpg",
      "https://cdn.example.com/g2.jpg",
    ]);
  });

  it("portraitImageUrl is null when portrait_image is null", async () => {
    mockGet.mockResolvedValue({
      data: [{ ...item, portrait_image: null }],
      meta: {},
    });
    const [conf] = await getConferences();
    expect(conf.portraitImageUrl).toBeNull();
  });

  it("returns [] when strapiGet throws", async () => {
    mockGet.mockRejectedValue(new Error("network error"));
    const result = await getConferences();
    expect(result).toEqual([]);
  });
});
