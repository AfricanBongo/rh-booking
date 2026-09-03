import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { acceptInvitation } from "./invitations";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseMock } from "@/tests/mocks/supabase";

const mockCreateClient = vi.mocked(createClient);

const invitation = {
  id: "inv-1",
  room_group_id: "rg-1",
  inviter_id: "user-2",
  invitee_id: "user-1",
};

const roomGroup = {
  id: "rg-1",
  conference_id: "conf-1",
  room_type_id: "rt-1",
  max_occupants: 2,
};

function makeSelectChain(resolvedValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
}

function makeUpdateChain() {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
}

function makeInsertChain() {
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
}

function makeSelectArrayChain(resolvedValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
  };
  (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue(resolvedValue);
  return chain;
}

function setupAcceptMock(firstBookingPrice: number) {
  const mock = createSupabaseMock();

  const invitationChain = makeSelectChain({ data: invitation, error: null });
  const roomGroupChain = makeSelectChain({ data: roomGroup, error: null });
  const firstBookingChain = makeSelectChain({ data: { total_price: firstBookingPrice }, error: null });
  const updateInvitationChain = makeUpdateChain();
  const insertBookingChain = makeInsertChain();

  mock.from
    .mockReturnValueOnce(invitationChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(roomGroupChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(firstBookingChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(updateInvitationChain as unknown as ReturnType<typeof mock.from>)
    .mockReturnValueOnce(insertBookingChain as unknown as ReturnType<typeof mock.from>);

  mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

  return { mock, invitationChain, roomGroupChain, firstBookingChain, updateInvitationChain, insertBookingChain };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("acceptInvitation", () => {
  it("new booking gets first booking's total_price", async () => {
    const { insertBookingChain } = setupAcceptMock(29500);
    await acceptInvitation("inv-1", "user-1");

    const insertArg = (insertBookingChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.total_price).toBe(29500);
  });

  it("new booking has amount_paid 0 and status confirmed", async () => {
    const { insertBookingChain } = setupAcceptMock(29500);
    await acceptInvitation("inv-1", "user-1");

    const insertArg = (insertBookingChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.amount_paid).toBe(0);
    expect(insertArg.status).toBe("confirmed");
  });

  it("existing bookings are NOT updated (update only called once for invitation)", async () => {
    const { mock, updateInvitationChain } = setupAcceptMock(29500);
    await acceptInvitation("inv-1", "user-1");

    const allUpdateCalls = mock.from.mock.calls
      .map((call: unknown[], i: number) => {
        const chain = mock.from.mock.results[i]?.value;
        return chain?.update?.mock?.calls?.length ?? 0;
      })
      .reduce((sum: number, n: number) => sum + n, 0);

    expect(allUpdateCalls).toBe(1);
    expect((updateInvitationChain.update as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it("throws when invitation not found", async () => {
    const mock = createSupabaseMock();
    const invitationChain = makeSelectChain({
      data: null,
      error: { message: "not found" },
    });
    mock.from.mockReturnValueOnce(invitationChain as unknown as ReturnType<typeof mock.from>);
    mockCreateClient.mockResolvedValue(mock as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(acceptInvitation("bad-id", "user-1")).rejects.toThrow(
      /not found|Invitation not found/i
    );
  });
});
