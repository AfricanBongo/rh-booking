import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { POST } from "./route";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseMock } from "@/tests/mocks/supabase";

const mockCreateClient = vi.mocked(createClient);

function makeRequest(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

function makeExistingBookingChain(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data }),
  };
}

function makeRoomGroupChain(id: string) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id }, error: null }),
  };
}

function makeBookingChain(id: string) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id }, error: null }),
  };
}

function makeInsertOnlyChain() {
  return { insert: vi.fn().mockResolvedValue({ error: null }) };
}

function setupSuccessMock(existingBooking: unknown = null) {
  const mock = createSupabaseMock();
  mock.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@test.com" } },
    error: null,
  });

  const existingChain = makeExistingBookingChain(existingBooking);
  const roomGroupChain = makeRoomGroupChain("rg-1");
  const bookingChain = makeBookingChain("b-1");
  const childrenChain = makeInsertOnlyChain();
  const diningChain = makeInsertOnlyChain();

  mock.from
    .mockReturnValueOnce(existingChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(roomGroupChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(bookingChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(childrenChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(diningChain as unknown as ReturnType<typeof mock.from>);

  mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

  return { mock, existingChain, roomGroupChain, bookingChain, childrenChain, diningChain };
}

const validBody = {
  conferenceId: "c-1",
  roomTypeId: "rt-1",
  roomType: "shared-2",
  bedPreference: "king",
  roomPrice: 29500,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/bookings", () => {
  it("returns 401 when no user", async () => {
    const mock = createSupabaseMock();
    mock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 when conferenceId is missing", async () => {
    const mock = createSupabaseMock();
    mock.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
      error: null,
    });
    mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(makeRequest({ roomTypeId: "rt-1", bedPreference: "king", roomPrice: 29500 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when roomPrice is a string", async () => {
    const mock = createSupabaseMock();
    mock.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
      error: null,
    });
    mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(makeRequest({
      conferenceId: "c-1", roomTypeId: "rt-1", bedPreference: "king", roomPrice: "29500",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 409 when already booked", async () => {
    const mock = createSupabaseMock();
    mock.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
      error: null,
    });

    const existingChain = makeExistingBookingChain({ id: "existing-b" });
    mock.from.mockReturnValueOnce(existingChain as unknown as ReturnType<typeof mock.from>);
    mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });

  it("sets correct total_price with no children and no dining", async () => {
    const { bookingChain } = setupSuccessMock();
    await POST(makeRequest(validBody));

    const insertArg = (bookingChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.total_price).toBe(29500);
  });

  it("total_price includes guest surcharge for child age 14+", async () => {
    const { bookingChain } = setupSuccessMock();
    const body = { ...validBody, children: [{ age: 14, diningPassId: null }] };
    await POST(makeRequest(body));

    const insertArg = (bookingChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.total_price).toBe(59000);
  });

  it("total_price includes dining pass cost", async () => {
    const { bookingChain } = setupSuccessMock();
    const body = { ...validBody, myDiningPassId: "dp-1", myDiningPassName: "Full Pass", myDiningPassPrice: 12000 };
    await POST(makeRequest(body));

    const insertArg = (bookingChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.total_price).toBe(41500);
  });

  it("inserts dining pass record with correct dining_pass_id", async () => {
    const mock = createSupabaseMock();
    mock.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
      error: null,
    });

    const existingChain = makeExistingBookingChain(null);
    const roomGroupChain = makeRoomGroupChain("rg-1");
    const bookingChain = makeBookingChain("b-1");
    const diningChain = makeInsertOnlyChain();

    mock.from
      .mockReturnValueOnce(existingChain as unknown as ReturnType<typeof mock.from>)
      .mockReturnValueOnce(roomGroupChain as unknown as ReturnType<typeof mock.from>)
      .mockReturnValueOnce(bookingChain as unknown as ReturnType<typeof mock.from>)
      .mockReturnValueOnce(diningChain as unknown as ReturnType<typeof mock.from>);

    mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

    const body = { ...validBody, myDiningPassId: "dp-1", myDiningPassName: "Full Pass", myDiningPassPrice: 12000 };
    await POST(makeRequest(body));

    const insertArg = (diningChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const rows = Array.isArray(insertArg) ? insertArg : [insertArg];
    expect(rows[0].dining_pass_id).toBe("dp-1");
  });

  it("returns bookingId and roomGroupId in response", async () => {
    setupSuccessMock();
    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(json).toMatchObject({ bookingId: "b-1", roomGroupId: "rg-1" });
  });
});
