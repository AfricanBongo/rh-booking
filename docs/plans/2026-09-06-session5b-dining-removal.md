# Session 5B: Dining Removal, Children Rework, Payment Fixes

> **For the executing agent:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Remove dining passes entirely, revert children labeling and remove surcharges (info-only for 12+), fix the supabaseKey bug, uncap the age picker, send "payment confirmed" email when cash invoices are paid, then complete remaining Session 5A tasks (payment history, dead code, image variants).

**Architecture:** Dining removal is pure deletion across Strapi, Supabase, store, API, and UI. Children rework removes billing logic and replaces it with an informational note (children are still added to bookings, just not billed). The payment email uses pg_net to call a new Edge Function from the existing invoice-paid trigger, with Vault secrets for environment portability.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand, Supabase (Postgres + Edge Functions + pg_net + Vault), Strapi v5, UseSend

**Baseline:** 113 tests passing across 17 files (post-Tasks 1-2 from Session 5A).

**Provenance:** Every file path and line number verified against `.worktrees/session5` on 2026-09-06.

---

## Constraint: Test Breakage Policy

No users exist, so we **will** rewrite tests that break due to these changes. However: rewrite only the specific assertions that change, do not delete test coverage, and always run `npm test` before committing.

## Constraint: Children are still tracked

Children are still added in the booking flow UI, still recorded in the `children` table, still shown on the confirm page. We are ONLY removing: the surcharge billing, the 12+ charge warning, and the dining pass association. The age input, add/remove child buttons, and child rows in the API all stay.

---

## Task 1: Remove Dining Passes (Full Removal)

### Files to DELETE

- `app/book/[conferenceId]/dining/page.tsx`
- `app/book/[conferenceId]/dining/DiningPassClient.tsx`
- `lib/data/dining-passes.ts`
- `lib/data/dining-passes.test.ts`
- `strapi/src/api/dining-pass/` (entire directory, 4 files)

### Files to MODIFY

**`stores/booking-flow.ts`:**
- Remove `diningPassId: string | null` from `AdditionalGuest` interface (line 5)
- Remove `myDiningPassId` from state interface (line 17) and `initialState` (line 43)
- Remove `setMyDiningPass` (line 26, 56) and `setGuestDiningPass` (lines 27, 57-60)

**`stores/booking-flow.test.ts`:**
- Delete entire `"dining pass management"` describe block (lines 32-59)
- Remove `diningPassId: null` from all test guest objects
- Remove `myDiningPassId` references from reset test

**`app/api/bookings/route.ts`:**
- Remove dining pass fields from body destructure (lines 22-23)
- Remove dining total calculation (lines 61-67)
- Change totalPrice to `perPerson + surcharge` (line 69)
- Remove `dining_pass_id` from children insert (line 93)
- Remove entire `booking_dining_passes` insert block (lines 99-133)

**`app/api/bookings/route.test.ts`:**
- Remove `diningChain` from `setupSuccessMock` (line 57, 64), reduce mock chain from 5 to 4
- Delete `"total_price includes dining pass cost"` test (lines 151-158)
- Delete `"inserts dining pass record"` test (lines 160-186)

**Server pages** (remove `getDiningPassesForConference` import + usage):
- `app/book/[conferenceId]/page.tsx` (lines 3, 17, 31)
- `app/book/[conferenceId]/children/page.tsx` (lines 2, 15, 31)
- `app/book/[conferenceId]/roommate/page.tsx` (lines 4, 22, 38)
- `app/book/[conferenceId]/confirm/page.tsx` (lines 4, 25, 53)

**Client components** (remove `hasDiningPasses` prop, simplify step labels):
- `app/book/[conferenceId]/RoomSelectionClient.tsx`: remove prop (line 18, 21), step labels become `isPrivate ? ["Room", "Children", "Confirm"] : ["Room", "Children", "Roommate", "Confirm"]`
- `app/book/[conferenceId]/children/ChildrenPageClient.tsx`: remove prop (line 19, 22), same step labels, Continue always goes to `roommate` or `confirm`
- `app/book/[conferenceId]/roommate/RoommatePageClient.tsx`: remove prop (line 28, 31), step labels `["Room", "Children", "Roommate", "Confirm"]`, currentStep=3, Back always to `children`
- `app/book/[conferenceId]/confirm/ConfirmPageClient.tsx`: remove `DiningPass` import (line 11), remove `diningPasses` prop (line 25, 41), remove `myDiningPassId` from store (line 44), remove dining total computation (lines 70-76), remove dining from summary/total/body

**`components/booking/StepIndicator.tsx`:** default labels `["Room", "Children", "Roommate", "Confirm"]` (line 10)

**`strapi/src/api/conference/content-types/conference/schema.json`:** remove `dining_passes` relation (lines 62-67)

### New migration

`supabase/migrations/011_drop_dining_passes.sql`:
```sql
DROP TABLE IF EXISTS booking_dining_passes;
```

### Commit
```bash
git commit -m "refactor(booking): remove dining passes entirely"
```

---

## Task 2: Children Rework -- Remove Surcharge, Info Note, Revert Labels

Depends on Task 1.

**`lib/utils/children.ts`** -- replace body, keep exports:
```ts
export interface ChildInput { age: number; }
export type GuestInput = ChildInput;
export const calculateChildrenSurcharge = (): number => 0;
export const calculateGuestSurcharge = calculateChildrenSurcharge;
```

**`lib/utils/children.test.ts`** -- rewrite: single test verifying surcharge returns 0.

**`lib/constants/index.ts`** -- delete `CHILDREN_SURCHARGE_MULTIPLIER` (line 5).

**`app/book/[conferenceId]/children/ChildrenPageClient.tsx`:**
- Remove `calculateChildrenSurcharge` import (line 9)
- Remove surcharge/billableCount computation (lines 39-40)
- Update toggle description: `"Add children traveling with you."`
- Replace 12+ charge warning with info note: `"Children aged 12 and above may be subject to additional charges. The RoyalHouse team will contact you directly."`
- Replace billable warning block with softer info note using `InfoIcon`
- Add `InfoIcon` to Phosphor imports

**`app/book/[conferenceId]/confirm/ConfirmPageClient.tsx`:**
- Remove `calculateChildrenSurcharge` import
- Remove surcharge computation, change total to `perPerson` only
- Change children label to `"Children"` (from `"Additional guests"`)
- Remove billable count from value, remove surcharge line item

**`app/api/bookings/route.ts`:**
- Remove `calculateChildrenSurcharge` import and surcharge from total

**`app/api/bookings/route.test.ts`:**
- Rewrite surcharge test: child age 14 does NOT change total (stays 29500)

### Commit
```bash
git commit -m "refactor(children): remove surcharges, add info note for 12+, revert to Children labels"
```

---

## Task 3: Age Picker -- min 0, max 99

**`lib/validations/children.ts`:** age `z.number().int().min(0).max(99)`, remove `diningPassId` field.

**`lib/validations/children.test.ts`:** rewrite: age 0 valid, age 25 valid, age 99 valid, age -1 invalid, age 100 invalid.

**`app/book/[conferenceId]/children/ChildrenPageClient.tsx`:** `min={0} max={99}`, clamp `Math.max(0, Math.min(99, ...))`, default new child age to `0`.

### Commit
```bash
git commit -m "fix(children): allow age 0-99, remove max 17 cap"
```

---

## Task 4: Fix "supabaseKey is required"

**`lib/hooks/usePaymentUpdates.ts` line 7:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Commit
```bash
git commit -m "fix(payments): use correct env var name for Supabase key in usePaymentUpdates"
```

---

## Task 5: Cash Invoice Paid Email to User

### New files
- `supabase/functions/notify-invoice-paid/index.ts` -- Edge Function, uses UseSend to email user
- `supabase/migrations/012_notify_invoice_paid_trigger.sql` -- pg_net trigger on `stripe.invoices`
- `docs/scripts/setup-vault-secrets.sql` -- one-time SQL for staging/production

### Modified files
- `supabase/config.toml` -- add `[functions.notify-invoice-paid]` section
- `supabase/seed.sql` -- add local dev Vault secrets

### Commit
```bash
git commit -m "feat(payments): send email to user when cash invoice is marked as paid"
```

---

## Task 6: Payment History RPC + UI (from Session 5A Task 3)

Per `docs/plans/2026-09-04-session5-flow-fixes.md` Task 3 exactly.

Note: the `diningPasses` removal in Task 1 changes the confirm page but NOT the pay page. Payment history is independent.

### Commit (two commits per original plan)
```bash
git commit -m "feat(db): add get_booking_payment_history RPC"
git commit -m "feat(payments): show payment history on pay page"
```

---

## Task 7: Remove Dead Stub Functions (from Session 5A Task 4)

Per `docs/plans/2026-09-04-session5-flow-fixes.md` Task 4 exactly.

### Commit
```bash
git commit -m "refactor(data): remove unimplemented booking stub functions"
```

---

## Task 8: Image Payload Reduction (from Session 5A Task 5)

Per `docs/plans/2026-09-04-session5-flow-fixes.md` Task 5 exactly.

### Commit
```bash
git commit -m "perf(images): serve Strapi format variants instead of full-resolution originals"
```

---

## Execution Order

```
Task 1  Remove dining passes       -- first, biggest change
Task 2  Children rework            -- after Task 1 (labels depend on dining removal)
Task 3  Age picker                 -- after Task 2 (touches same files)
Task 4  Fix supabaseKey            -- independent
Task 5  Invoice paid email         -- independent
Task 6  Payment history            -- independent
Task 7  Dead code removal          -- independent
Task 8  Image variants             -- independent
```

Tasks 1-3 are sequential. Tasks 4-8 are independent and can run after 1-3.

---

## Final Checklist

```bash
npm test          # all tests passing
npx tsc --noEmit  # no type errors
npm run build     # build succeeds
```
