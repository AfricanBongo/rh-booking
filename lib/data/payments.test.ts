import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { getPaymentHistory } from "./payments";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function makeRpcMock(data: unknown, error: unknown = null) {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error }),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getPaymentHistory", () => {
  it("maps card payment row correctly", async () => {
    const row = { id: "cs_1", amount: 2500, method: "card", status: "paid", paid_at: "2026-08-01T00:00:00Z", receipt_url: null };
    mockCreateClient.mockResolvedValue(makeRpcMock([row]) as never);

    const result = await getPaymentHistory("booking-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "cs_1", amount: 2500, method: "card", status: "paid", paidAt: "2026-08-01T00:00:00Z", receiptUrl: null });
  });

  it("maps cash payment row with receipt_url", async () => {
    const row = { id: "in_1", amount: 5000, method: "cash", status: "paid", paid_at: "2026-08-02T00:00:00Z", receipt_url: "https://invoice.stripe.com/i/acct_1/in_1" };
    mockCreateClient.mockResolvedValue(makeRpcMock([row]) as never);

    const result = await getPaymentHistory("booking-1");
    expect(result[0]).toMatchObject({ method: "cash", receiptUrl: "https://invoice.stripe.com/i/acct_1/in_1" });
  });

  it("returns empty array on error", async () => {
    mockCreateClient.mockResolvedValue(makeRpcMock(null, { message: "permission denied" }) as never);

    const result = await getPaymentHistory("booking-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    mockCreateClient.mockResolvedValue(makeRpcMock(null) as never);

    const result = await getPaymentHistory("booking-1");
    expect(result).toEqual([]);
  });
});
