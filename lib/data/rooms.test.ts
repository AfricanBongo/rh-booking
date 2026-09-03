import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/strapi");
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { strapiGet } from "@/lib/strapi";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseMock } from "@/tests/mocks/supabase";
import { getRoomTypesWithAvailability } from "./rooms";

const mockGet = vi.mocked(strapiGet);
const mockCreateClient = vi.mocked(createClient);

const roomItem = {
  id: 1,
  documentId: "rt-abc",
  type: "shared-2" as const,
  price: 29500,
  total_available: 20,
  description: "Shared room for 2",
  images: [
    { url: "https://cdn.example.com/room1.jpg" },
    { url: "/uploads/room2.jpg" },
  ],
  conferences: [{ documentId: "conf-1" }],
};

beforeEach(() => {
  vi.resetAllMocks();
  process.env.NEXT_PUBLIC_STRAPI_URL = "https://cms.test";
});

describe("getRoomTypesWithAvailability mapping", () => {
  function setupSupabaseMock(bookingData: unknown[] = []) {
    const supabaseMock = createSupabaseMock();
    (supabaseMock._chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: bookingData,
    });
    mockCreateClient.mockResolvedValue(supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>);
    return supabaseMock;
  }

  it("maps total_available to totalAvailable", async () => {
    mockGet.mockResolvedValue({ data: [roomItem], meta: {} });
    setupSupabaseMock([]);
    const [rt] = await getRoomTypesWithAvailability("conf-1");
    expect(rt.totalAvailable).toBe(20);
  });

  it("imageUrl equals first image URL", async () => {
    mockGet.mockResolvedValue({ data: [roomItem], meta: {} });
    setupSupabaseMock([]);
    const [rt] = await getRoomTypesWithAvailability("conf-1");
    expect(rt.imageUrl).toBe("https://cdn.example.com/room1.jpg");
  });

  it("imageUrls has length 2", async () => {
    mockGet.mockResolvedValue({ data: [roomItem], meta: {} });
    setupSupabaseMock([]);
    const [rt] = await getRoomTypesWithAvailability("conf-1");
    expect(rt.imageUrls).toHaveLength(2);
  });

  it("imageUrl is null when images is null", async () => {
    mockGet.mockResolvedValue({
      data: [{ ...roomItem, images: null }],
      meta: {},
    });
    setupSupabaseMock([]);
    const [rt] = await getRoomTypesWithAvailability("conf-1");
    expect(rt.imageUrl).toBeNull();
  });

  it("remaining equals totalAvailable when 0 bookings", async () => {
    mockGet.mockResolvedValue({ data: [roomItem], meta: {} });
    setupSupabaseMock([]);
    const [rt] = await getRoomTypesWithAvailability("conf-1");
    expect(rt.remaining).toBe(20);
  });
});
