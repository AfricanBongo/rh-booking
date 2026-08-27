# Cash Payment UI Polish + Admin Email Notification - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update payment button labels to "Pay $X online" / "Pay $X in cash", stack on mobile, improve cash success messaging, and send an email to the finance admin when a user requests a cash payment.

**Architecture:** UI changes in two component files (PaymentCard + PurchaseForm). A new Supabase Edge Function (`notify-cash-payment`) sends email via useSend SDK when the `stripe-checkout` function successfully creates a cash invoice. The edge function is called internally from `stripe-checkout` (fire-and-forget, non-blocking).

**Tech Stack:** React/TypeScript (UI), Supabase Edge Functions (Deno), usesend-js (email SDK)

---

## Context for the Implementor

### Project Structure

- `app/(app)/pay/PaymentCard.tsx` - room payment card (client component)
- `app/(marketing)/merch/[slug]/PurchaseForm.tsx` - merch purchase form (client component)
- `supabase/functions/stripe-checkout/index.ts` - edge function that creates invoices/checkout sessions
- `supabase/functions/` - each function is a folder with `index.ts` + `deno.json`
- `supabase/.env.local` - env vars for edge functions (STRIPE_SECRET_KEY, APP_URL currently)
- `supabase/config.toml` - function config

### Key Patterns

- `PillButton` component accepts: `size`, `fullWidth`, `disabled`, `onClick`, `variant` (including `"outline"`), `className`
- Responsive: use Tailwind `flex-col md:flex-row` for mobile-stacked, desktop-row
- Edge functions are Deno-based, use `npm:` specifiers in deno.json imports
- The `stripe-checkout` edge function calls other services via `fetch()` — fire-and-forget pattern

### Environment Variables (to add to `supabase/.env.local`)

```
USESEND_KEY=us_xxxxx
FINANCE_ADMIN_EMAIL=finance@royalhouse.org
```

### useSend SDK Usage (Deno/npm)

```typescript
import { UseSend } from "npm:usesend-js";

const usesend = new UseSend(Deno.env.get("USESEND_KEY")!);

await usesend.emails.send({
  to: "admin@church.org",
  from: "noreply@royalhouse.org",
  subject: "Cash Payment Request",
  html: "<p>HTML content</p>",
  text: "Plain text fallback",
});
```

---

## Task 1: Update PaymentCard Button Labels and Layout

**Files:**
- Modify: `app/(app)/pay/PaymentCard.tsx`

**Step 1: Update button container to stack on mobile**

Find the button container div (currently `<div className="flex gap-3">`). Change to:

```tsx
<div className="flex flex-col md:flex-row gap-3">
```

**Step 2: Update the online pay button label**

Find the button text that shows `Pay ${amount}`. Change from:

```tsx
<>
  <CurrencyDollarIcon size={18} />
  Pay ${isValidAmount ? (amount / 100).toFixed(2) : "..."}
</>
```

to:

```tsx
<>
  <CurrencyDollarIcon size={18} />
  Pay ${isValidAmount ? (amount / 100).toFixed(2) : "..."} online
</>
```

Also ensure this button has `fullWidth` prop.

**Step 3: Update the cash button label and make it a PillButton with fullWidth**

Replace the cash `<button>` element with a `PillButton` variant="outline" with fullWidth:

```tsx
<PillButton
  size="md"
  fullWidth
  variant="outline"
  disabled={!isValidAmount || submitting || cashSubmitting}
  onClick={handleCashPayment}
>
  {cashSubmitting ? (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      Requesting...
    </span>
  ) : (
    <>
      <ReceiptIcon size={18} />
      Pay ${isValidAmount ? (amount / 100).toFixed(2) : "..."} in cash
    </>
  )}
</PillButton>
```

Note: changed "Registering..." to "Requesting..."

**Step 4: Update the cash success message**

Find the `cashSuccess` block. Change from:

```tsx
<div className="flex flex-col items-center gap-2 py-4 text-center">
  <CheckCircleIcon size={32} weight="bold" className="text-success" />
  <p className="text-sm font-medium">Cash payment of ${((cashSuccess as number) / 100).toFixed(2)} registered</p>
  <p className="text-xs text-muted">Show this to your church admin to mark as received.</p>
</div>
```

to:

```tsx
<div className="flex flex-col items-center gap-2 py-4 text-center">
  <CheckCircleIcon size={32} weight="bold" className="text-success" />
  <p className="text-sm font-medium">Cash payment has been requested</p>
  <p className="text-xs text-muted">We have let the admin know. You may proceed to submit the cash for this payment. If payment does not reflect within a couple of minutes after admin clearing your invoice, please let the admin know.</p>
</div>
```

**Step 5: Commit**

```bash
git add app/(app)/pay/PaymentCard.tsx
git commit -m "feat(ui): update payment buttons to 'online'/'in cash' labels with responsive stacking"
```

---

## Task 2: Update PurchaseForm Button Labels and Layout

**Files:**
- Modify: `app/(marketing)/merch/[slug]/PurchaseForm.tsx`

**Step 1: Update button container to stack on mobile**

Find `<div className="flex gap-3">` (line 142). Change to:

```tsx
<div className="flex flex-col md:flex-row gap-3">
```

**Step 2: Update the online purchase button label**

Change the "Purchase" text to show the price:

```tsx
{submitting ? (
  <span className="inline-flex items-center gap-2">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
    Processing...
  </span>
) : (
  <>
    <CurrencyDollarIcon size={18} />
    Pay ${(price / 100).toFixed(2)} online
  </>
)}
```

This requires adding `CurrencyDollarIcon` to the imports:

```typescript
import { MapTrifoldIcon, WarningCircleIcon, CheckCircleIcon, ReceiptIcon, CurrencyDollarIcon } from "@phosphor-icons/react";
```

**Step 3: Replace the cash `<button>` with PillButton**

Replace the raw `<button>` element with:

```tsx
<PillButton
  size="lg"
  fullWidth
  variant="outline"
  disabled={submitting || cashSubmitting || (pickupLocations.length > 0 && !pickupLocationId)}
  onClick={handleCashPurchase}
>
  {cashSubmitting ? (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      Requesting...
    </span>
  ) : (
    <>
      <ReceiptIcon size={18} />
      Pay ${(price / 100).toFixed(2)} in cash
    </>
  )}
</PillButton>
```

**Step 4: Update the cash success message**

Change from:

```tsx
<p className="text-sm font-medium">Cash payment of ${((cashSuccess as number) / 100).toFixed(2)} registered for {merchItemName}</p>
<p className="text-xs text-muted">Show this to your church admin to mark as received.</p>
```

to:

```tsx
<p className="text-sm font-medium">Cash payment has been requested</p>
<p className="text-xs text-muted">We have let the admin know. You may proceed to submit the cash for this payment. If payment does not reflect within a couple of minutes after admin clearing your invoice, please let the admin know.</p>
```

**Step 5: Commit**

```bash
git add app/(marketing)/merch/[slug]/PurchaseForm.tsx
git commit -m "feat(ui): update merch buttons to 'online'/'in cash' labels with responsive stacking"
```

---

## Task 3: Create the Notify Cash Payment Edge Function

**Files:**
- Create: `supabase/functions/notify-cash-payment/index.ts`
- Create: `supabase/functions/notify-cash-payment/deno.json`

**Step 1: Create the deno.json**

Create `supabase/functions/notify-cash-payment/deno.json`:

```json
{
  "imports": {
    "usesend-js": "npm:usesend-js@latest"
  }
}
```

**Step 2: Write the edge function**

Create `supabase/functions/notify-cash-payment/index.ts`:

```typescript
import { UseSend } from "usesend-js";

const usesendKey = Deno.env.get("USESEND_KEY")!;
const financeEmail = Deno.env.get("FINANCE_ADMIN_EMAIL")!;
const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@royalhousechurch.org";

const usesend = new UseSend(usesendKey);

interface CashPaymentNotification {
  userName: string;
  userEmail: string;
  amount: number;
  description: string;
  invoiceId: string;
  type: "room_payment" | "merch";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body: CashPaymentNotification = await req.json();
    const { userName, userEmail, amount, description, invoiceId, type } = body;

    const amountFormatted = `$${(amount / 100).toFixed(2)}`;
    const invoiceUrl = `https://dashboard.stripe.com/invoices/${invoiceId}`;
    const paymentType = type === "room_payment" ? "Room Payment" : "Merchandise";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">RoyalHouse Conferences</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 20px; font-weight: 600;">Cash Payment Request</h2>
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 14px; line-height: 1.6;">
                A member has requested to pay in cash. Please verify receipt of funds and mark the invoice as paid in Stripe.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f8fa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Member</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${userName} (${userEmail})</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Amount</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 20px; font-weight: 700;">${amountFormatted}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Payment For</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${description}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Type</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${paymentType}</p>
                  </td>
                </tr>
              </table>
              <a href="${invoiceUrl}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">View Invoice in Stripe</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">This is an automated notification from the RoyalHouse Booking Platform.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `Cash Payment Request\n\nMember: ${userName} (${userEmail})\nAmount: ${amountFormatted}\nPayment For: ${description}\nType: ${paymentType}\n\nView Invoice: ${invoiceUrl}\n\nPlease verify receipt of funds and mark the invoice as paid in Stripe.`;

    await usesend.emails.send({
      to: financeEmail,
      from: fromEmail,
      subject: `Cash Payment Request - ${amountFormatted} from ${userName}`,
      html,
      text,
    });

    console.info("[notify-cash-payment] Email sent to:", financeEmail, "| Invoice:", invoiceId);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[notify-cash-payment] Error:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Failed to send notification" }, { status: 500 });
  }
});
```

**Step 3: Add function config to supabase/config.toml**

Add at the end of `supabase/config.toml`:

```toml
[functions.notify-cash-payment]
enabled = true
verify_jwt = false
entrypoint = "./functions/notify-cash-payment/index.ts"
```

**Step 4: Add env vars to `supabase/.env.local`**

Append to `supabase/.env.local`:

```
USESEND_KEY=us_placeholder_replace_me
FINANCE_ADMIN_EMAIL=finance@example.com
FROM_EMAIL=noreply@royalhousechurch.org
```

**Step 5: Commit**

```bash
git add supabase/functions/notify-cash-payment/ supabase/config.toml supabase/.env.local
git commit -m "feat(email): add notify-cash-payment edge function with useSend"
```

---

## Task 4: Call Notify Function from stripe-checkout After Cash Invoice Creation

**Files:**
- Modify: `supabase/functions/stripe-checkout/index.ts`

**Step 1: Add a fire-and-forget call to the notify function**

In the `handleCashInvoice` function, after the line:

```typescript
console.info("[stripe-checkout:cash] Invoice created and finalized:", invoice.id);
```

Add a fire-and-forget notification call (non-blocking, errors are logged but don't fail the response):

```typescript
// Fire-and-forget: notify finance admin
const notifyPayload = {
  userName: "", // will be fetched below
  userEmail,
  amount,
  description,
  invoiceId: invoice.id,
  type: metadata.type || "room_payment",
};

// Fetch user's full name for the email
const { data: profile } = await supabase
  .from("profiles")
  .select("full_name")
  .eq("id", userId)
  .single();

notifyPayload.userName = profile?.full_name || userEmail;

// Non-blocking notification
fetch(`${supabaseUrl}/functions/v1/notify-cash-payment`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${supabaseServiceKey}`,
  },
  body: JSON.stringify(notifyPayload),
}).catch((err) => {
  console.error("[stripe-checkout:cash] Failed to send notification:", err);
});
```

Place this BEFORE the final `return Response.json(...)` line. The `fetch` is NOT awaited - it's fire-and-forget so it doesn't slow down the response to the user.

Note: `supabaseUrl` and `supabaseServiceKey` are already available as module-level constants in this file.

**Step 2: Commit**

```bash
git add supabase/functions/stripe-checkout/index.ts
git commit -m "feat(payments): notify finance admin on cash payment request"
```

---

## Task 5: Final Verification

**Step 1: Verify build passes**

```bash
npm run build
```

Expected: No type errors.

**Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass.

**Step 3: Commit and version bump**

```bash
npm run release
git push --follow-tags
```

---

## Files Changed Summary

| File | Action |
|------|--------|
| `app/(app)/pay/PaymentCard.tsx` | Modify (button labels, layout, success message) |
| `app/(marketing)/merch/[slug]/PurchaseForm.tsx` | Modify (button labels, layout, success message) |
| `supabase/functions/notify-cash-payment/index.ts` | Create (email notification edge function) |
| `supabase/functions/notify-cash-payment/deno.json` | Create (usesend-js import) |
| `supabase/config.toml` | Modify (add function config) |
| `supabase/.env.local` | Modify (add USESEND_KEY, FINANCE_ADMIN_EMAIL, FROM_EMAIL) |
| `supabase/functions/stripe-checkout/index.ts` | Modify (call notify function after invoice creation) |
