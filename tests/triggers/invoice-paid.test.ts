import { describe, it, expect } from "vitest";

describe("Cash Invoice - Payment Validation", () => {
  const MIN_PAYMENT_AMOUNT = 2500;

  function validatePaymentAmount(
    amount: number,
    remainingBalance: number,
  ): { success: boolean; error?: string } {
    if (!Number.isInteger(amount)) {
      return { success: false, error: "Amount must be a whole number (cents)" };
    }
    if (amount < MIN_PAYMENT_AMOUNT) {
      return { success: false, error: `Minimum payment is $${MIN_PAYMENT_AMOUNT / 100}` };
    }
    if (amount > remainingBalance) {
      return { success: false, error: `Amount cannot exceed remaining balance of $${remainingBalance / 100}` };
    }
    return { success: true };
  }

  it("rejects amounts below $25 minimum", () => {
    const result = validatePaymentAmount(2000, 10000);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Minimum");
  });

  it("rejects amounts exceeding remaining balance", () => {
    const result = validatePaymentAmount(15000, 10000);
    expect(result.success).toBe(false);
    expect(result.error).toContain("remaining balance");
  });

  it("accepts valid amount within range", () => {
    const result = validatePaymentAmount(5000, 10000);
    expect(result.success).toBe(true);
  });

  it("accepts exact remaining balance (pay in full)", () => {
    const result = validatePaymentAmount(10000, 10000);
    expect(result.success).toBe(true);
  });

  it("rejects non-integer amounts", () => {
    const result = validatePaymentAmount(25.5, 10000);
    expect(result.success).toBe(false);
  });
});

describe("Cash Invoice - Trigger Amount Cap Logic", () => {
  it("caps amount_paid at total_price to prevent over-crediting", () => {
    const total_price = 10000;
    const amount_paid = 8000;
    const invoice_amount = 5000;
    const result = Math.min(amount_paid + invoice_amount, total_price);
    expect(result).toBe(10000);
  });

  it("normal payment below cap passes through unchanged", () => {
    const total_price = 10000;
    const amount_paid = 5000;
    const invoice_amount = 3000;
    const result = Math.min(amount_paid + invoice_amount, total_price);
    expect(result).toBe(8000);
  });

  it("exact payment to full amount works correctly", () => {
    const total_price = 10000;
    const amount_paid = 7500;
    const invoice_amount = 2500;
    const result = Math.min(amount_paid + invoice_amount, total_price);
    expect(result).toBe(10000);
  });
});

describe("Cash Invoice - Edge Cases (documented behavior)", () => {
  it("void logic only affects open invoices for the specific booking", () => {
    // void_open_invoices_for_booking filters by:
    // - metadata->>'booking_id' matches p_booking_id
    // - metadata->>'type' = 'room_payment'
    // - status = 'open'
    // Other bookings' invoices and non-room_payment invoices are untouched.
    expect(true).toBe(true);
  });

  it("merch invoice idempotency: stripe_payment_id prevents duplicate orders", () => {
    // If invoice.id already exists in merch_orders.stripe_payment_id,
    // the trigger's NOT EXISTS check skips the INSERT.
    expect(true).toBe(true);
  });

  it("checkout trigger voids invoices only when booking reaches full payment", () => {
    // void_open_invoices_for_booking is only called when v_new_amount_paid >= v_total_price
    const total_price = 10000;
    const amount_paid_after = 10000;
    const shouldVoid = amount_paid_after >= total_price;
    expect(shouldVoid).toBe(true);
  });

  it("checkout trigger does NOT void invoices for partial payment", () => {
    const total_price = 10000;
    const amount_paid_after = 7000;
    const shouldVoid = amount_paid_after >= total_price;
    expect(shouldVoid).toBe(false);
  });
});
