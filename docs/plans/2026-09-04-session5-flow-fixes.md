# Session 5: Flow Fixes, Payment History, Image Payload

> **For the executing agent:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix 7 verified booking-flow navigation bugs, 4 stale labels, wire up payment history from Stripe, remove dead code, and cut image payload using Strapi format variants.

**Baseline:** 226 tests passing across 34 files on `develop`.

**Scope note:** Account deletion is deliberately deferred. The `delete_own_account` RPC stays in place, unused, until a soft-delete design is agreed. Do not touch it.

**Provenance:** Every file path and line number below was verified against source on 2026-09-04. If reality disagrees with this plan, STOP and report rather than improvising.

---

## Two constraints that will bite you if ignored

### 1. Stripe tables are `service_role`-only

`stripe.invoices` and `stripe.checkout_sessions` are NOT granted to `authenticated` (see `supabase/migrations/20260827154947_service_role_invoice_grants.sql`). A client-side query returns an empty result with **no error**. Payment history MUST go through the `SECURITY DEFINER` RPC in Task 3, which verifies booking ownership internally.

### 2. Do NOT remove `unoptimized` from any `<Image>`

Verified reasons:

- `next.config.ts` `remotePatterns` allows only `cms.donl.me`, but images now serve from `media.royalhousena.org` (Cloudflare R2). Next.js rejects non-listed hosts with **400** before any handler runs.
- `@opennextjs/cloudflare` skips optimization entirely when `env.IMAGES` is undefined (see `node_modules/@opennextjs/cloudflare/dist/cli/templates/images.js`: *"Image optimization is disabled and the original image is returned if `env.IMAGES` is undefined"*). `wrangler.jsonc` has an `ASSETS` binding but **no `IMAGES` binding**.

Net effect of removing `unoptimized` today: every image 400s, and even after fixing `remotePatterns` the worker would fetch the original and return it byte-identical, adding a hop for nothing.

Task 5 delivers the payload win a different way.

---

## Task 0: Create Notion tasks (BEFORE any code)

**Data source:** `collection://1a285468-0e19-4769-af00-f0f796f35eab`
**Project relation:** `["https://app.notion.com/p/387574308c65813087d2c7d964c950f8"]`

Create these 5 tasks, all Status "Not Started":

| Task | Priority |
|------|----------|
| `fix(booking): dining and roommate step navigation for private rooms` | High |
| `fix(ui): rename remaining Children labels to Guests` | Medium |
| `feat(payments): payment history from Stripe invoices and checkout sessions` | High |
| `refactor(data): remove dead stub functions` | Low |
| `perf(images): serve Strapi format variants instead of originals` | Medium |

Move each to **In Progress** on start, **Done** when its commit lands.

---

## Task 1: Booking flow navigation fixes

**Root cause:** `DiningPassClient` and `RoommatePageClient` never receive the selected room type, so they cannot branch on private vs shared. Fix by passing `roomPriceMap` down from the server page, the exact pattern `ChildrenPageClient` already uses.

### Bugs being fixed

| # | Bug | Location |
|---|-----|----------|
| 1 | Dining "Continue" always routes to `/roommate` | `DiningPassClient.tsx:109` |
| 2 | Dining fallback redirect always routes to `/roommate` | `DiningPassClient.tsx:37` |
| 3 | Dining step labels hardcoded to 4 steps | `DiningPassClient.tsx:41` |
| 4 | Roommate StepIndicator has no labels, hardcoded 3/4 | `RoommatePageClient.tsx:115` |
| 5 | Roommate "Back" always goes to `/children` | `RoommatePageClient.tsx:258` |
| 6 | Roommate page has no private-room guard | `RoommatePageClient.tsx:59` |
| 7 | `maxOccupants` derived from wrong room type | `roommate/page.tsx:20-21` |

Bug 7 detail: the server page picks the first non-private room type in the **conference**, not the room the **user selected**. With both shared-2 and shared-4 available, a shared-4 booker gets capped at 2 occupants.

### Step 1a: `app/book/[conferenceId]/dining/page.tsx`

Add room types alongside the dining pass fetch:

```tsx
import { getRoomTypes } from "@/lib/data/rooms";

const [diningPasses, roomTypes] = await Promise.all([
  getDiningPassesForConference(conferenceId),
  getRoomTypes(conferenceId),
]);

const roomPriceMap = Object.fromEntries(
  roomTypes.map((rt) => [rt.id, { price: rt.price, type: rt.type }])
);

<DiningPassClient
  conferenceId={conferenceId}
  diningPasses={diningPasses}
  roomPriceMap={roomPriceMap}
/>
```

### Step 1b: `app/book/[conferenceId]/dining/DiningPassClient.tsx`

Add the prop:

```tsx
interface RoomInfo { price: number; type: "private" | "shared-2" | "shared-4"; }

interface DiningPassClientProps {
  conferenceId: string;
  diningPasses: DiningPass[];
  roomPriceMap: Record<string, RoomInfo>;
}
```

After the `!selectedRoomTypeId` guard, derive the room type:

```tsx
const room = roomPriceMap[selectedRoomTypeId];
const isPrivate = room?.type === "private";
const nextStep = isPrivate ? "confirm" : "roommate";
```

Then fix three call sites:

- **Line 37** (fallback redirect): `router.replace(\`/book/${conferenceId}/${nextStep}\`)`
- **Line 41** (step labels):
  ```tsx
  const stepLabels = isPrivate
    ? ["Room", "Guests", "Dining", "Confirm"]
    : ["Room", "Guests", "Dining", "Roommate", "Confirm"];
  ```
- **Line 109** (Continue): `router.push(\`/book/${conferenceId}/${nextStep}\`)`

`StepIndicator` already receives `totalSteps={stepLabels.length}`, so the count self-corrects. `currentStep={3}` stays correct because Dining is always step 3.

### Step 1c: `app/book/[conferenceId]/roommate/page.tsx`

**Delete** `maxOccupantsMap` (lines 10-14) and the `maxOccupants` prop entirely. That calculation is bug 7.

```tsx
import { getDiningPassesForConference } from "@/lib/data/dining-passes";

const [roomTypes, diningPasses] = await Promise.all([
  getRoomTypes(conferenceId),
  getDiningPassesForConference(conferenceId),
]);

const roomPriceMap = Object.fromEntries(
  roomTypes.map((rt) => [rt.id, { price: rt.price, type: rt.type }])
);

<RoommatePageClient
  conferenceId={conferenceId}
  roomPriceMap={roomPriceMap}
  hasDiningPasses={diningPasses.length > 0}
/>
```

### Step 1d: `app/book/[conferenceId]/roommate/RoommatePageClient.tsx`

Swap the props, move `maxOccupantsMap` into the client, derive from the user's actual selection:

```tsx
const maxOccupantsMap: Record<string, number> = {
  private: 1, "shared-2": 2, "shared-4": 4,
};

interface RoomInfo { price: number; type: "private" | "shared-2" | "shared-4"; }

interface RoommatePageClientProps {
  conferenceId: string;
  roomPriceMap: Record<string, RoomInfo>;
  hasDiningPasses: boolean;
}
```

After the `!selectedRoomTypeId` guard (line 59):

```tsx
const room = roomPriceMap[selectedRoomTypeId];
const isPrivate = room?.type === "private";

// NEW: private-room guard for direct URL navigation
if (isPrivate) {
  router.replace(`/book/${conferenceId}/confirm`);
  return <div />;
}

const maxOccupants = room ? maxOccupantsMap[room.type] : 2;
```

Fix the StepIndicator (line 115):

```tsx
const stepLabels = hasDiningPasses
  ? ["Room", "Guests", "Dining", "Roommate", "Confirm"]
  : ["Room", "Guests", "Roommate", "Confirm"];
const currentStep = hasDiningPasses ? 4 : 3;

<StepIndicator currentStep={currentStep} totalSteps={stepLabels.length} labels={stepLabels} />
```

Fix the Back button (line 258):

```tsx
onClick={() => router.push(`/book/${conferenceId}/${hasDiningPasses ? "dining" : "children"}`)}
```

### Step 1e: Verify

Grep `RoommatePageClient` and `DiningPassClient` to confirm only their own server pages construct them.

### Step 1f: Commit

```bash
git add app/book/
git commit -m "fix(booking): correct step navigation and room type detection in dining and roommate steps"
```

---

## Task 2: Label cleanup

Depends on Task 1 (RoomSelectionClient gains `hasDiningPasses`).

### Step 2a: `components/booking/StepIndicator.tsx:10`

```tsx
const defaultLabels = ["Room", "Guests", "Roommate", "Confirm"];
```

### Step 2b: `app/book/[conferenceId]/RoomSelectionClient.tsx`

Step 1 currently doesn't know about dining passes, so its step count disagrees with every later page. Fetch dining passes in the server page (`app/book/[conferenceId]/page.tsx`) and pass `hasDiningPasses` down.

Replace line 50:

```tsx
const stepLabels = isPrivate
  ? (hasDiningPasses ? ["Room", "Guests", "Dining", "Confirm"] : ["Room", "Guests", "Confirm"])
  : (hasDiningPasses ? ["Room", "Guests", "Dining", "Roommate", "Confirm"] : ["Room", "Guests", "Roommate", "Confirm"]);
const totalSteps = stepLabels.length;
```

This makes the indicator consistent across all five booking pages.

### Step 2c: `app/book/[conferenceId]/confirm/ConfirmPageClient.tsx`

- Line 132: `label="Children"` becomes `label="Additional guests"`
- Line 153: `"Children surcharge"` becomes `"Guest surcharge"`

Step labels here are already correct. Do not change them.

### Step 2d: Commit

```bash
git add components/booking/StepIndicator.tsx app/book/
git commit -m "fix(ui): rename remaining Children labels to Guests"
```

---

## Task 3: Payment history

Independent of Tasks 1, 2, 4, 5.

**Two sources, both required:**

| Source | Trigger | Amount column | Status column |
|--------|---------|---------------|---------------|
| `stripe.checkout_sessions` | Online card payment | `amount_total` | `payment_status = 'paid'` |
| `stripe.invoices` | Cash payment marked paid by admin | `total` | `status = 'paid'` |

Both carry `metadata->>'booking_id'` and `metadata->>'type' = 'room_payment'` (set in `supabase/functions/stripe-checkout/index.ts`).

### Step 3a: Migration `supabase/migrations/010_payment_history_rpc.sql`

```sql
-- Unified payment history for a booking: online card payments (stripe.checkout_sessions)
-- plus cash payments marked paid by an admin (stripe.invoices).
-- SECURITY DEFINER because the stripe schema is granted to service_role only.
-- Ownership is verified inside the function; a non-owner receives an empty set
-- rather than an error, so booking existence is not leaked.
CREATE OR REPLACE FUNCTION public.get_booking_payment_history(p_booking_id uuid)
RETURNS TABLE (
  id text,
  amount bigint,
  method text,
  status text,
  paid_at timestamptz,
  receipt_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, stripe
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = p_booking_id
      AND bookings.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cs.id,
    cs.amount_total::bigint,
    'card'::text,
    'paid'::text,
    to_timestamp(cs.created),
    NULL::text
  FROM stripe.checkout_sessions cs
  WHERE cs.metadata->>'booking_id' = p_booking_id::text
    AND cs.metadata->>'type' = 'room_payment'
    AND cs.payment_status = 'paid'

  UNION ALL

  SELECT
    i.id,
    i.total,
    'cash'::text,
    'paid'::text,
    to_timestamp(i.created),
    i.hosted_invoice_url
  FROM stripe.invoices i
  WHERE i.metadata->>'booking_id' = p_booking_id::text
    AND i.metadata->>'type' = 'room_payment'
    AND i.status = 'paid'

  ORDER BY 5 DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_payment_history(uuid) TO authenticated;
```

Apply locally:

```bash
npx supabase migration up
```

### Step 3b: Rewrite `lib/data/payments.ts`

The existing `getPaymentHistory` (line 45) queries a `payments` table that does not exist in any migration. It silently returns `[]` forever. Zero callers, so the interface can change freely.

```ts
export interface Payment {
  id: string;
  amount: number;
  method: "card" | "cash";
  status: "paid";
  paidAt: string;
  receiptUrl: string | null;
}

export async function getPaymentHistory(bookingId: string): Promise<Payment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_booking_payment_history", {
    p_booking_id: bookingId,
  });

  if (error || !data) return [];

  return data.map((row: {
    id: string;
    amount: number;
    method: string;
    status: string;
    paid_at: string;
    receipt_url: string | null;
  }) => ({
    id: row.id,
    amount: row.amount,
    method: row.method as "card" | "cash",
    status: "paid" as const,
    paidAt: row.paid_at,
    receiptUrl: row.receipt_url,
  }));
}
```

Leave `getBookingPaymentSummary` untouched.

### Step 3c: `app/(app)/pay/page.tsx`

```tsx
import { getPaymentHistory } from "@/lib/data/payments";

const bookingsWithNames = await Promise.all(
  rows.map(async (booking) => {
    let conferenceName = "Conference";
    try {
      const conf = await getConference(booking.conference_id);
      conferenceName = conf.name;
    } catch { /* noop */ }
    const payments = await getPaymentHistory(booking.id);
    return { ...booking, conferenceName, payments };
  })
);
```

Pass `payments={booking.payments}` to `PaymentCard`.

### Step 3d: `app/(app)/pay/PaymentCard.tsx`

Add `payments: Payment[]` to the props interface. Render a collapsible section between the progress bar and the payment form:

```tsx
{payments.length > 0 && (
  <details className="group border-t border-border pt-4">
    <summary className="cursor-pointer text-sm font-medium flex items-center justify-between list-none select-none">
      Payment history ({payments.length})
      <CaretDownIcon size={16} className="text-muted transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <ul className="mt-3 space-y-2 animate-slide-up">
      {payments.map((p) => <PaymentHistoryRow key={p.id} payment={p} />)}
    </ul>
  </details>
)}
```

Create `PaymentHistoryRow` in its own file. AGENTS.md forbids complex JSX inside `.map()`.

Each row shows:
- Date, formatted via the existing `LocalizedDate` component
- Method as `<Badge variant="soft">` reading "Card" or "Cash"
- Amount, right-aligned
- Receipt link when `receiptUrl` is present

Follow `docs/design.md` section 6 for the disclosure animation (`animate-slide-up`) and section 8 for spacing and radius.

**Realtime note:** `PaymentCard` already runs `usePaymentUpdates`. The progress bar updates live; history is server-fetched and will not. That is acceptable. Do NOT wire realtime into history.

### Step 3e: Commits

```bash
git add supabase/migrations/010_payment_history_rpc.sql
git commit -m "feat(db): add get_booking_payment_history RPC"

git add lib/data/payments.ts app/\(app\)/pay/
git commit -m "feat(payments): show payment history on pay page"
```

---

## Task 4: Remove dead code

Independent. Trivial.

`lib/data/bookings.ts`: delete `getBooking()` (lines 19-22) and `getUserBooking()` (lines 24-31). Both throw `"not implemented"` and have **zero callers** (verified by grep across the repo).

Drop the `Booking` interface too if nothing imports it. Grep first.

**Keep** `RegistrationData` and `registerForConference`. Those are live and called by `/api/register-conference`.

```bash
git add lib/data/bookings.ts
git commit -m "refactor(data): remove unimplemented booking stub functions"
```

---

## Task 5: Image payload reduction

Independent. Zero deploy risk as scoped.

**What was cut from the original Phase 6 plan and why:** see "Two constraints" at the top. Removing `unoptimized` breaks every image and gains nothing on this deploy target.

**The real win:** Strapi already emits `thumbnail` (245px), `small` (500px), `medium` (750px), `large` (1000px) on every upload. The data layer discards all of them and serves the full-resolution original into 112px thumbnails.

### Step 5a: `next.config.ts`

Add the R2 hosts. Correct config regardless of anything else:

```ts
remotePatterns: [
  { protocol: "https", hostname: "cms.donl.me" },
  { protocol: "https", hostname: "media.royalhousena.org" },
  { protocol: "https", hostname: "staging.media.royalhousena.org" },
],
```

### Step 5b: Expose formats in the data layer

In `lib/data/conferences.ts`, `lib/data/rooms.ts`, `lib/data/merch.ts`:

```ts
export interface ImageFormats {
  thumbnail: string | null;
  small: string | null;
  medium: string | null;
  large: string | null;
}
```

Strapi shape is `formats: { thumbnail?: { url }, small?: { url }, medium?: { url }, large?: { url } } | null`.

Map each through the existing `resolveImageUrl` helper. Expose the result alongside `imageUrl`. **Keep `imageUrl` unchanged** so no existing consumer breaks.

### Step 5c: Pick the right variant per context

| Context | Variant |
|---------|---------|
| Room type slider thumbnail (renders 80-112px) | `small` |
| Room type lightbox (fullscreen) | `large` |
| Merch listing card | `small` |
| Merch detail page | `large` |
| Conference card (16/10 aspect) | `medium` |
| Dashboard conference scroll card (200px) | `small` |
| Dashboard merch scroll card (160px) | `small` |
| Conference detail hero (full-bleed) | original |
| Landing page hero (full-bleed) | original |

**Always fall back to the original** when a variant is absent. Strapi skips generating variants larger than the source image.

`ImageSlider` and `ImageLightbox` keep their raw `<img>` tags. They rely on the View Transitions API and `next/image` complicates that. Callers just pass a smaller URL.

**Leave `unoptimized` in place on every `<Image>`.** Revisit only if an `IMAGES` binding is added to `wrangler.jsonc`, as its own separately-tested change.

### Step 5d: Commit

```bash
git add next.config.ts lib/data/ components/ app/
git commit -m "perf(images): serve Strapi format variants instead of full-resolution originals"
```

---

## Testing

All 226 existing tests must stay green. Run `npm test` before every commit.

### New tests

| File | Tests |
|------|-------|
| `lib/data/payments.test.ts` | maps RPC rows to `Payment`; returns `[]` on error; returns `[]` when data is null; maps both `card` and `cash` methods |
| `lib/data/conferences.test.ts` (extend) | `formats` mapping resolves relative URLs; missing variants map to null |

Mock helpers already exist at `tests/mocks/supabase.ts` and `tests/mocks/strapi.ts`.

**No tests for:** navigation fixes (routing logic, verified manually) or label changes (string constants).

### Manual verification checklist

- [ ] Private room + dining passes exist: Room > Guests > Dining > Confirm, indicator shows 4 steps
- [ ] Shared room + dining passes exist: Room > Guests > Dining > Roommate > Confirm, indicator shows 5 steps
- [ ] Shared room, no dining passes: Room > Guests > Roommate > Confirm, 4 steps, no Dining
- [ ] Direct URL to `/roommate` with a private room selected redirects to Confirm
- [ ] Conference with both shared-2 and shared-4: select shared-4, roommate page allows 3 invites
- [ ] Roommate Back button lands on Dining when passes exist, Children when they do not
- [ ] Pay page shows both a card payment and a cash payment in history
- [ ] Payment history is empty (not errored) for a booking with no payments
- [ ] Room card thumbnails load the 500px variant, verified in the Network tab

---

## Execution order

```
Task 0  Notion            -- first, no code
Task 1  Navigation        -- no deps
Task 2  Labels            -- after Task 1
Task 3  Payment history   -- independent, can parallelize
Task 4  Dead code         -- independent, trivial
Task 5  Images            -- independent, zero risk
```

Tasks 1 then 2 are sequential. Tasks 3, 4, 5 are independent of everything and of each other.

---

## Final checklist

```bash
npm test          # 226+ tests, all passing
npx tsc --noEmit  # no errors in our files
npm run build     # build succeeds
```

Then push the branch and open a PR into `develop`.
