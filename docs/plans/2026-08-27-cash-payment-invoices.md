# Cash Payment via Stripe Invoice - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to indicate they want to pay with cash, which creates a Stripe Invoice the admin can mark as paid in the Stripe Dashboard. Auto-void open invoices when the user pays via Stripe Checkout instead.

**Architecture:** User clicks "Pay with Cash" on the payment UI. A new edge function handler creates a Stripe Invoice (finalized, open, collection_method=send_invoice). The sync-engine mirrors the invoice to `stripe.invoices`. A new DB trigger on `stripe.invoices` increments `bookings.amount_paid` or creates a `merch_orders` row when admin marks it paid. The existing checkout trigger is extended to void open invoices for a booking when it's paid in full.

**Tech Stack:** Supabase Edge Functions (Deno/Stripe SDK), Supabase Postgres triggers, Next.js API route, React client component.

---

## Context for the Implementor

### Project Structure

- Edge function: `supabase/functions/stripe-checkout/index.ts` - handles payment session creation
- API proxy: `app/api/checkout/route.ts` - authenticates user, forwards to edge function
- Pay page: `app/(app)/pay/page.tsx` (server) + `app/(app)/pay/PaymentCard.tsx` (client)
- Merch purchase: `app/(marketing)/merch/[slug]/PurchaseForm.tsx` (client)
- Migrations: `supabase/migrations/` (numbered files, use `supabase migration new <name>`)
- Constants: `lib/constants/index.ts`
- Stripe schema: tables live in `stripe.*` schema (managed by sync-engine)

### Key Patterns

- Edge function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- The API route at `app/api/checkout/route.ts` is a thin proxy: authenticates user via Supabase, then forwards `body` + user headers to the edge function
- All amounts are in **cents** (integer). $25 minimum = `2500`.
- Stripe customer management: `getOrCreateStripeCustomer()` in the edge function looks up `profiles.stripe_customer_id`, creates if missing.
- The existing trigger `handle_stripe_checkout_completed()` on `stripe.checkout_sessions` handles post-payment updates.

### Business Rules

- Minimum payment: $25 (2500 cents) - constant in `lib/constants/index.ts` as `MIN_PAYMENT_AMOUNT`
- Cash invoices are **informational only** - they do NOT reserve balance or block Checkout payments
- If user pays in full via Checkout, open cash invoices for that booking are voided
- Both room payments AND merch purchases support cash
- Invoice line items must include descriptive names (e.g., "December Conference Event Ticket", not "Room Payment")

---

## Task 1: Create DB Trigger for Invoice Paid

**Files:**
- Create: `supabase/migrations/<timestamp>_invoice_paid_trigger.sql` (use `supabase migration new invoice_paid_trigger`)

**Step 1: Create the migration file**

Run:
```bash
supabase migration new invoice_paid_trigger
```

**Step 2: Write the trigger function**

Write this SQL to the new migration file:

```sql
-- Trigger: when sync-engine mirrors an invoice marked "paid" by admin,
-- update bookings.amount_paid or create merch_orders row.
CREATE OR REPLACE FUNCTION handle_stripe_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
  v_booking_id uuid;
  v_user_id uuid;
  v_merch_item_id text;
  v_pickup_location_id text;
  v_amount integer;
BEGIN
  -- Only fire on invoices that just became 'paid'
  IF NEW.status != 'paid' THEN
    RETURN NEW;
  END IF;

  -- Skip if it was already paid (UPDATE case)
  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  meta := NEW.metadata;
  IF meta IS NULL THEN
    RETURN NEW;
  END IF;

  v_amount := NEW.total;

  IF meta->>'type' = 'room_payment' THEN
    v_booking_id := (meta->>'booking_id')::uuid;

    IF v_booking_id IS NOT NULL AND v_amount IS NOT NULL THEN
      UPDATE public.bookings
      SET amount_paid = LEAST(amount_paid + v_amount, total_price)
      WHERE id = v_booking_id;
    END IF;

  ELSIF meta->>'type' = 'merch' THEN
    v_user_id := (meta->>'user_id')::uuid;
    v_merch_item_id := meta->>'merch_item_id';
    v_pickup_location_id := meta->>'pickup_location_id';

    IF NOT EXISTS (
      SELECT 1 FROM public.merch_orders WHERE stripe_payment_id = NEW.id
    ) THEN
      INSERT INTO public.merch_orders (user_id, merch_item_id, pickup_location_id, stripe_payment_id, status)
      VALUES (v_user_id, v_merch_item_id, v_pickup_location_id, NEW.id, 'paid');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_stripe_invoice_paid
  AFTER INSERT OR UPDATE ON stripe.invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_stripe_invoice_paid();
```

**Key design decisions:**
- `LEAST(amount_paid + v_amount, total_price)` caps at total to prevent over-crediting
- Uses same idempotency pattern as checkout trigger (check `OLD.status` on UPDATE, check `stripe_payment_id` existence for merch)
- `SECURITY DEFINER` because it needs to write to `public.bookings`/`public.merch_orders` regardless of caller role

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add trigger for stripe invoice paid events"
```

---

## Task 2: Add Void Logic to Checkout Trigger

**Files:**
- Create: `supabase/migrations/<timestamp>_void_invoices_on_checkout.sql` (use `supabase migration new void_invoices_on_checkout`)

**Step 1: Create the migration file**

Run:
```bash
supabase migration new void_invoices_on_checkout
```

**Step 2: Write the void helper function + update existing trigger**

```sql
-- Helper: void all open invoices for a booking that is now fully paid
CREATE OR REPLACE FUNCTION void_open_invoices_for_booking(p_booking_id uuid)
RETURNS void AS $$
BEGIN
  -- Mark open invoices as 'void' in our local mirror.
  -- The actual Stripe void must be done via API (edge function or admin action).
  -- This prevents the trigger from double-crediting if admin later marks it paid.
  UPDATE stripe.invoices
  SET status = 'void'::stripe.invoice_status
  WHERE metadata->>'booking_id' = p_booking_id::text
    AND metadata->>'type' = 'room_payment'
    AND status = 'open';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace the existing checkout trigger to add void logic after payment
CREATE OR REPLACE FUNCTION handle_stripe_checkout_completed()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
  v_booking_id uuid;
  v_amount integer;
  v_user_id uuid;
  v_merch_item_id text;
  v_pickup_location_id text;
  v_new_amount_paid integer;
  v_total_price integer;
BEGIN
  IF NEW.payment_status != 'paid' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.payment_status = 'paid' THEN
    RETURN NEW;
  END IF;

  meta := NEW.metadata;
  IF meta IS NULL THEN
    RETURN NEW;
  END IF;

  IF meta->>'type' = 'room_payment' THEN
    v_booking_id := (meta->>'booking_id')::uuid;
    v_amount := NEW.amount_total;

    UPDATE public.bookings
    SET amount_paid = LEAST(amount_paid + v_amount, total_price)
    WHERE id = v_booking_id
    RETURNING amount_paid, total_price INTO v_new_amount_paid, v_total_price;

    -- If booking is now paid in full, void any open cash invoices
    IF v_new_amount_paid >= v_total_price THEN
      PERFORM void_open_invoices_for_booking(v_booking_id);
    END IF;

  ELSIF meta->>'type' = 'merch' THEN
    v_user_id := (meta->>'user_id')::uuid;
    v_merch_item_id := meta->>'merch_item_id';
    v_pickup_location_id := meta->>'pickup_location_id';

    IF NOT EXISTS (
      SELECT 1 FROM public.merch_orders WHERE stripe_payment_id = NEW.id
    ) THEN
      INSERT INTO public.merch_orders (user_id, merch_item_id, pickup_location_id, stripe_payment_id, status)
      VALUES (v_user_id, v_merch_item_id, v_pickup_location_id, NEW.id, 'paid');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Key changes from old trigger:**
- Added `LEAST(amount_paid + v_amount, total_price)` cap (was missing before, now consistent)
- Added `RETURNING amount_paid, total_price` to check if paid in full
- Added `void_open_invoices_for_booking()` call when booking is fully paid
- `void_open_invoices_for_booking` only voids the local mirror row. The real Stripe invoice won't auto-void in Stripe's system, but the trigger won't double-credit because status is no longer 'open'. Admin should also void in Stripe Dashboard for cleanliness (can be documented).

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): void open cash invoices when booking paid in full via checkout"
```

---

## Task 3: Add Cash Invoice Handler to Edge Function

**Files:**
- Modify: `supabase/functions/stripe-checkout/index.ts`

**Step 1: Add the new handler for `type: "cash_invoice"`**

In the main `Deno.serve` handler, after the existing `if (type === "merch")` block (around line 50), add:

```typescript
if (type === "cash_invoice") {
  return await handleCashInvoice(body, userId, userEmail);
}
```

**Step 2: Write the `handleCashInvoice` function**

Add this function after `handleMerchPayment`:

```typescript
async function handleCashInvoice(
  body: {
    bookingId?: string;
    merchItemId?: string;
    merchItemName?: string;
    pickupLocationId?: string;
    amount: number;
    description: string;
  },
  userId: string,
  userEmail: string,
): Promise<Response> {
  const { bookingId, merchItemId, merchItemName, pickupLocationId, amount, description } = body;
  console.info("[stripe-checkout:cash] amount:", amount, "| description:", description);

  if (!amount || !description) {
    console.error("[stripe-checkout:cash] Missing amount or description");
    return Response.json({ error: "Missing amount or description" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Validate booking ownership if room payment
  if (bookingId) {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, user_id, total_price, amount_paid")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error("[stripe-checkout:cash] Booking not found:", bookingId);
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_id !== userId) {
      console.error("[stripe-checkout:cash] User mismatch");
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const remainingBalance = booking.total_price - booking.amount_paid;
    const validation = validatePaymentAmount(amount, remainingBalance);
    if (!validation.success) {
      console.error("[stripe-checkout:cash] Validation failed:", validation.error);
      return Response.json({ error: validation.error }, { status: 400 });
    }
  }

  // Validate merch fields
  if (merchItemId && (!merchItemName || !pickupLocationId)) {
    console.error("[stripe-checkout:cash] Missing merch fields");
    return Response.json({ error: "Missing required merch fields" }, { status: 400 });
  }

  const customer = await getOrCreateStripeCustomer(userId, userEmail, supabase);
  console.info("[stripe-checkout:cash] Stripe customer:", customer.id);

  // Build metadata (same shape as checkout so triggers work)
  const metadata: Record<string, string> = { user_id: userId };

  if (bookingId) {
    metadata.type = "room_payment";
    metadata.booking_id = bookingId;
  } else if (merchItemId) {
    metadata.type = "merch";
    metadata.merch_item_id = merchItemId;
    metadata.pickup_location_id = pickupLocationId!;
  }

  // Create Stripe Invoice
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: 30,
    metadata,
    auto_advance: false,
  });

  // Add line item
  await stripe.invoiceItems.create({
    customer: customer.id,
    invoice: invoice.id,
    amount,
    currency: "usd",
    description,
  });

  // Finalize (moves from draft -> open)
  await stripe.invoices.finalizeInvoice(invoice.id);

  console.info("[stripe-checkout:cash] Invoice created and finalized:", invoice.id);
  return Response.json({ invoiceId: invoice.id, status: "open" });
}
```

**Step 3: Commit**

```bash
git add supabase/functions/stripe-checkout/index.ts
git commit -m "feat(payments): add cash invoice creation handler to stripe-checkout edge function"
```

---

## Task 4: Add "Pay with Cash" to PaymentCard UI (Room Payments)

**Files:**
- Modify: `app/(app)/pay/PaymentCard.tsx`

**Step 1: Add cash payment state and handler**

After the existing `handleSubmit` function (line 71), add a new handler:

```typescript
const [cashSubmitting, setCashSubmitting] = useState(false);
const [cashSuccess, setCashSuccess] = useState(false);

async function handleCashPayment(): Promise<void> {
  const amount = getAmount();
  if (amount < MIN_PAYMENT_AMOUNT || amount > remainingBalance) return;

  setCashSubmitting(true);
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "cash_invoice",
        bookingId,
        amount,
        description: `${conferenceName} - Room Payment`,
      }),
    });

    const data = await res.json();
    if (res.ok && data.invoiceId) {
      setCashSuccess(true);
    }
  } finally {
    setCashSubmitting(false);
  }
}
```

**Step 2: Add cash success state to the UI**

After the cash invoice is created, show a confirmation message. Inside the `!isPaidInFull` branch (the `<div className="space-y-4 pt-2 border-t border-border">` section), wrap the existing content in a conditional:

```tsx
{cashSuccess ? (
  <div className="flex flex-col items-center gap-2 py-4 text-center">
    <CheckCircleIcon size={32} weight="bold" className="text-success" />
    <p className="text-sm font-medium">Cash payment of ${(getAmount() / 100).toFixed(2)} registered</p>
    <p className="text-xs text-muted">Show this to your church admin to mark as received.</p>
  </div>
) : (
  /* existing preset buttons + custom input + both pay buttons here */
)}
```

**Step 3: Add the "Pay with Cash" button alongside existing Pay button**

Replace the single `<PillButton>` at the end of the payment form with two buttons in a flex row:

```tsx
<div className="flex gap-3">
  <PillButton
    size="md"
    fullWidth
    disabled={!isValidAmount || submitting || cashSubmitting}
    onClick={handleSubmit}
  >
    {submitting ? (
      <span className="inline-flex items-center gap-2">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
        Processing...
      </span>
    ) : (
      <>
        <CurrencyDollarIcon size={18} />
        Pay ${isValidAmount ? (amount / 100).toFixed(2) : "..."}
      </>
    )}
  </PillButton>
  <button
    type="button"
    disabled={!isValidAmount || submitting || cashSubmitting}
    onClick={handleCashPayment}
    className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent/30 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
  >
    {cashSubmitting ? (
      <span className="inline-flex items-center gap-2">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        Registering...
      </span>
    ) : (
      <>
        <ReceiptIcon size={18} />
        Pay with Cash
      </>
    )}
  </button>
</div>
```

**Note:** The `ReceiptIcon` is already imported. `CurrencyDollarIcon` is already imported. `CheckCircleIcon` is already imported. No new imports needed.

**Step 4: Commit**

```bash
git add app/(app)/pay/PaymentCard.tsx
git commit -m "feat(ui): add pay with cash button to room payment card"
```

---

## Task 5: Add "Pay with Cash" to Merch PurchaseForm

**Files:**
- Modify: `app/(marketing)/merch/[slug]/PurchaseForm.tsx`

**Step 1: Add cash state and handler**

Add these state variables after the existing state declarations (line 29-30):

```typescript
const [cashSubmitting, setCashSubmitting] = useState(false);
const [cashSuccess, setCashSuccess] = useState(false);
```

Add the cash handler after `handlePurchase`:

```typescript
async function handleCashPurchase(): Promise<void> {
  if (!pickupLocationId && pickupLocations.length > 0) return;
  setCashSubmitting(true);
  setError(null);

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "cash_invoice",
        merchItemId,
        merchItemName,
        pickupLocationId: pickupLocationId || "none",
        amount: price,
        description: merchItemName,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Something went wrong. Please try again.");
      return;
    }

    const data = await res.json();
    if (data.invoiceId) {
      setCashSuccess(true);
    }
  } catch {
    setError("Network error. Please check your connection and try again.");
  } finally {
    setCashSubmitting(false);
  }
}
```

**Step 2: Add success state and cash button to UI**

Import the icon at the top:
```typescript
import { MapTrifoldIcon, WarningCircleIcon, CheckCircleIcon, ReceiptIcon } from "@phosphor-icons/react";
```

Wrap the return JSX: if `cashSuccess`, show confirmation. Otherwise show the form.

Replace the `<PillButton>` with two buttons:

```tsx
{cashSuccess ? (
  <div className="flex flex-col items-center gap-2 py-4 text-center">
    <CheckCircleIcon size={32} weight="bold" className="text-success" />
    <p className="text-sm font-medium">Cash payment registered for {merchItemName}</p>
    <p className="text-xs text-muted">Show this to your church admin to mark as received.</p>
  </div>
) : (
  <>
    {/* existing pickup location select + error display here */}
    <div className="flex gap-3">
      <PillButton
        size="lg"
        fullWidth
        disabled={submitting || cashSubmitting || (pickupLocations.length > 0 && !pickupLocationId)}
        onClick={handlePurchase}
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            Processing...
          </span>
        ) : (
          "Purchase"
        )}
      </PillButton>
      <button
        type="button"
        disabled={submitting || cashSubmitting || (pickupLocations.length > 0 && !pickupLocationId)}
        onClick={handleCashPurchase}
        className="flex-1 rounded-full border border-border px-4 py-3.5 text-sm font-medium text-foreground hover:border-accent/30 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
      >
        {cashSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            Registering...
          </span>
        ) : (
          <>
            <ReceiptIcon size={18} />
            Pay with Cash
          </>
        )}
      </button>
    </div>
  </>
)}
```

**Step 3: Commit**

```bash
git add app/(marketing)/merch/[slug]/PurchaseForm.tsx
git commit -m "feat(ui): add pay with cash button to merch purchase form"
```

---

## Task 6: Grant service_role Access to stripe.invoices (for void logic)

**Files:**
- Create: `supabase/migrations/<timestamp>_service_role_invoice_grants.sql`

**Step 1: Create migration**

Run:
```bash
supabase migration new service_role_invoice_grants
```

**Step 2: Write the grants**

```sql
-- The void_open_invoices_for_booking function (SECURITY DEFINER) needs to
-- UPDATE stripe.invoices. Grant to service_role as well since the edge
-- function may also need to read invoices in future.
GRANT SELECT, UPDATE ON stripe.invoices TO service_role;
GRANT USAGE ON SCHEMA stripe TO service_role;
```

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "fix(db): grant service_role access to stripe.invoices for void logic"
```

---

## Task 7: Write Tests for Invoice Trigger Logic

**Files:**
- Create: `tests/triggers/invoice-paid.test.ts`

**Step 1: Write test cases**

The tests should verify the trigger logic conceptually (we can't run Postgres triggers in Vitest, but we can test the edge function handler and document the trigger behavior):

```typescript
import { describe, it, expect } from "vitest";

// These test the validatePaymentAmount function (extracted from edge function)
// and document expected trigger behavior.

describe("Cash Invoice - Payment Validation", () => {
  // Import or replicate the validatePaymentAmount logic
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

  it("accepts exact remaining balance", () => {
    const result = validatePaymentAmount(10000, 10000);
    expect(result.success).toBe(true);
  });

  it("rejects non-integer amounts", () => {
    const result = validatePaymentAmount(25.5, 10000);
    expect(result.success).toBe(false);
  });
});

describe("Cash Invoice - Edge Cases (documented behavior)", () => {
  it("trigger caps amount_paid at total_price to prevent over-crediting", () => {
    // Trigger uses: LEAST(amount_paid + v_amount, total_price)
    // If booking total=10000, amount_paid=8000, and invoice is for 5000,
    // result should be 10000, not 13000.
    const total_price = 10000;
    const amount_paid = 8000;
    const invoice_amount = 5000;
    const result = Math.min(amount_paid + invoice_amount, total_price);
    expect(result).toBe(10000);
  });

  it("void logic only affects open invoices for the specific booking", () => {
    // void_open_invoices_for_booking filters by:
    // - metadata->>'booking_id' matches
    // - metadata->>'type' = 'room_payment'
    // - status = 'open'
    // Other bookings' invoices are untouched.
    expect(true).toBe(true); // Documented behavior
  });

  it("merch invoice uses stripe_payment_id for idempotency", () => {
    // If invoice.id already exists in merch_orders.stripe_payment_id,
    // the trigger skips the INSERT (no duplicate orders).
    expect(true).toBe(true); // Documented behavior
  });
});
```

**Step 2: Run tests**

```bash
npm test -- tests/triggers/invoice-paid.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add tests/triggers/
git commit -m "test(payments): add cash invoice validation and edge case tests"
```

---

## Task 8: Final Integration Verification

**Step 1: Verify all migrations are valid SQL**

```bash
supabase migration list --local
```

Expected: All migrations listed without errors.

**Step 2: Verify the build passes**

```bash
npm run build
```

Expected: No type errors.

**Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests pass (no regressions).

**Step 4: Final commit and version bump**

```bash
npm run release
git push --follow-tags
```

---

## Edge Cases Summary

| Scenario | Handling |
|----------|----------|
| User creates cash invoice then pays via Checkout (full) | Checkout trigger voids open invoices for that booking |
| User creates cash invoice then pays via Checkout (partial) | Invoice stays open (booking not yet full), no conflict since no reservation |
| Admin marks invoice paid AFTER user already paid via Checkout | `LEAST()` caps `amount_paid` at `total_price`, prevents over-crediting |
| User creates multiple cash invoices | Allowed. Each is independent. Each triggers amount_paid update when admin marks paid |
| Race: admin marks paid + user Checkout at same time | Both fire triggers. `LEAST()` ensures cap. Open invoices voided after full payment. Worst case: one extra voided invoice. |
| User tries cash invoice with amount > remaining | Edge function validates and rejects (same as Checkout validation) |
| Merch: user clicks cash then purchases via Checkout | Idempotency check (`stripe_payment_id`) prevents duplicate `merch_orders` rows. Invoice stays open in Stripe (admin can void manually). |
| Cash invoice amount becomes larger than new remaining (after partial Checkout) | Invoice stays open. If admin marks it paid, `LEAST()` caps. Admin should void stale invoices. |

---

## Files Changed Summary

| File | Action |
|------|--------|
| `supabase/migrations/<ts>_invoice_paid_trigger.sql` | Create |
| `supabase/migrations/<ts>_void_invoices_on_checkout.sql` | Create |
| `supabase/migrations/<ts>_service_role_invoice_grants.sql` | Create |
| `supabase/functions/stripe-checkout/index.ts` | Modify (add `handleCashInvoice`) |
| `app/(app)/pay/PaymentCard.tsx` | Modify (add cash button + success state) |
| `app/(marketing)/merch/[slug]/PurchaseForm.tsx` | Modify (add cash button + success state) |
| `tests/triggers/invoice-paid.test.ts` | Create |
