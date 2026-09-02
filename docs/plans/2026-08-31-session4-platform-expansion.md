# Session 4: Platform Expansion Design

> Dining passes, additional guests, conference images, CMS-managed home page, real-time payments, Strapi monorepo, pricing fix, Stripe auto-invoicing.

---

## Execution Order + Model Assignments

### Phase 0: Infrastructure (Owner tasks, blockers) -- No AI model
1. Migrate AWS services to bigger Lightsail instance
2. Set up staging environment
3. Branch protection rules on staging + main
4. Uptime Kuma status service on Coolify

### Phase 1: Strapi Monorepo (Task 7) -- Sonnet
Blocked on Phase 0 (Lightsail migration). Clone live Strapi to local, create `strapi/` subfolder in repo. Mechanical scaffolding, Docker boilerplate.

### Phase 2: Strapi Schema Changes (Tasks 3, 8, 1 - Strapi side) -- Sonnet
Add new content types and fields together once monorepo is running locally. Click-through Admin Panel work + pattern-following data layer files.

### Phase 3: Price Fix (Task 4) -- Opus
Remove per-person division logic. Price in Strapi IS per-person. High-risk cross-cutting change across 7+ files. Opus traces caller chains and invitation recalc edge cases.

### Phase 4: Additional Guests (Task 2) -- Opus
Rename children UI, drop gender, add dining pass opt-in. Type rename across store/validation/API/UI layers needs Opus to hold the full picture without drift.

### Phase 5: Dining Pass Booking Flow (Task 1 - frontend) -- Opus
New booking step for dining pass selection. Most complex new feature: new page, store extensions, migration, API changes, conditional step visibility across 4 existing pages.

### Phase 6: Conference Images + Carousel (Task 3 - frontend) -- Sonnet
Responsive portrait/landscape, gallery carousel. Straightforward data layer extension + standard HTML `<picture>` element. Reuses existing components.

### Phase 7: Main Page CMS (Task 8 - frontend) -- Sonnet
Connect landing page to Strapi Main Page single type. New data layer file follows established patterns. Conditional rendering, no edge cases.

### Phase 8: Real-time Payments (Task 6) -- Opus
Supabase Realtime for instant payment status updates. Channel lifecycle, useEffect cleanup race conditions, RLS interaction with Realtime filters. Opus handles hook lifecycle nuances.

### Phase 9: Stripe Configuration (Task 5) -- No AI model
Enable auto-receipts and auto-invoicing in Stripe Dashboard. Three toggles, no code.

---

## Task 1: Dining Pass

### Branding
"Dining Pass" - clean, official, hospitality-appropriate.

### Strapi Collection: `Dining Pass`

| Field | Type | Notes |
|-------|------|-------|
| `name` | Short text | e.g. "Full Dining Pass" |
| `description` | Long text | Optional. Shown in booking flow. |
| `price` | Number (integer) | In cents. e.g. 12000 = $120 |
| `meals_covered` | Number (integer) | e.g. 6 |
| `conferences` | Relation (many-to-many) | Linked to Conference |

No `is_active` field. Use Strapi publish/unpublish to control visibility.

### Booking Flow

New step: **Dining Pass** (after Additional Guests, before Roommate).

- Only shows if conference has published Dining Passes
- If no passes exist, step is skipped and step count adjusts
- Card-based tier selection (one card per pass tier)
- Independent selection: booker and each additional guest can each select a different tier or none
- Cost bundled into booking `total_price`

### Supabase Schema

```sql
CREATE TABLE booking_dining_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  dining_pass_id TEXT NOT NULL,
  dining_pass_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  for_guest_index INTEGER NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

`for_guest_index`: NULL = booker, 0+ = guest at that index in children table.

### Zustand Store Additions

```ts
myDiningPassId: string | null;
guestDiningPasses: (string | null)[];
```

### Stripe Integration

Dining Pass cost added to booking `total_price`. No separate payment flow. Shows as line item in price breakdown on confirm page and payment page.

---

## Task 2: Additional Guests (rename from Children)

### UI Changes

| Before | After |
|--------|-------|
| "Children attending" | "Additional guests" |
| "I have children attending" | "I have additional guests" |
| "Children under 12 stay free. Ages 12+ are charged." | "Guests under 12 stay free. Guests 12 and older are charged at the per-person room rate." |
| Collects: age + gender | Collects: age + dining pass opt-in |
| "Add a child" | "Add a guest" |

### Database Migration

```sql
ALTER TABLE children ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE children ADD COLUMN dining_pass_id TEXT NULL;
```

### Zustand Store

```ts
-- Before
interface ChildEntry { age: number; gender: "male" | "female"; }

-- After
interface AdditionalGuest { age: number; diningPassId: string | null; }
```

### Surcharge Logic

Unchanged. Guests 12+ charged at per-person room rate.

---

## Task 3: Conference Images

### Strapi Changes (on Conference content type)

| Field | Type | Notes |
|-------|------|-------|
| `image` | Single media | Existing. Label: "Main Image (Landscape 4:3)" |
| `portrait_image` | Single media | New. Optional. Label: "Portrait Image (3:4)" |
| `other_images` | Multiple media | New. Optional. Label: "Gallery Images" |

### Cloudflare R2

Production Strapi uses `@strapi/provider-upload-aws-s3` configured with R2 credentials. Dev and staging use local uploads.

### Frontend

**Conference detail page:**
- Desktop: landscape image as hero
- Mobile: portrait image if available, fallback to landscape with object-cover
- Implementation: `<picture>` element with `<source media="(max-width: 768px)">`

**Gallery:**
- Below info cards, above About section
- Only renders if `other_images` has items
- Uses existing `ImageSlider` + `ImageLightbox` components

**Data layer:**
```ts
interface Conference {
  // existing fields...
  portraitImageUrl: string | null;
  otherImageUrls: string[];
}
```

---

## Task 4: Room Price Fix

### Problem

`calculatePerPersonPrice(roomPriceCents, maxOccupants)` divides room price by occupants. But the price in Strapi is already per-person.

### Fix

Remove the division. Use `room.price` directly as the per-person rate.

### Files Affected

- `lib/utils/price.ts` - remove or simplify `calculatePerPersonPrice`
- `lib/utils/price.test.ts` - update test expectations
- `app/book/[conferenceId]/RoomSelectionClient.tsx`
- `app/book/[conferenceId]/children/ChildrenPageClient.tsx`
- `app/book/[conferenceId]/confirm/ConfirmPageClient.tsx`
- `app/api/bookings/route.ts`
- `lib/data/invitations.ts`

---

## Task 5: Stripe Auto-Invoicing

No code. Stripe Dashboard configuration only.

### Settings to Enable

1. **Settings -> Emails -> Receipts:** Enable "Email customers for successful payments"
2. **Settings -> Emails -> Invoices:** Enable "Email finalized invoices and credit notes to customers"
3. **Settings -> Emails -> Invoices:** Enable "Email invoices and receipts when manually marked as paid"

---

## Task 6: Real-time Payment Updates

### Approach

Supabase Realtime subscription on `bookings` table, filtered by `user_id`.

### Optimization

- One channel per user (not per booking)
- Subscribe only on pages that show payment data
- Cleanup on unmount

### Implementation

```ts
// lib/hooks/usePaymentUpdates.ts
export function usePaymentUpdates(
  userId: string,
  onUpdate: (bookingId: string, amountPaid: number) => void
): void
```

### Pages

- `/pay` (PaymentCard)
- `/dashboard`
- `/dashboard/conferences/[slug]`

### Postgres

Enable Realtime on `bookings` table via Supabase Dashboard or migration.

---

## Task 7: Strapi Monorepo

### Structure

```
rh-booking/
  strapi/
    package.json
    src/api/
    config/
      database.ts
      server.ts
      plugins.ts
    public/uploads/
    Dockerfile
    docker-compose.dev.yml
    docker-compose.staging.yml
    docker-compose.prod.yml
    .env.example
```

### Setup Steps

1. Run `npx create-strapi@latest strapi` in repo root
2. Add Dockerfile (multi-stage Node 20 alpine build)
3. Add docker-compose files per environment
4. Export live Strapi content types + data via `strapi transfer` or `strapi export`
5. Import into local instance
6. Document required env vars

### Docker Compose

Each environment:
- `strapi` service: builds from Dockerfile, env vars from Coolify
- `postgres` service: for dev/staging (prod may use external DB)

### Coolify Deployment

- Select repo, point to `strapi/` subfolder
- Use Docker Compose buildpack
- Set env vars per environment
- Enable "preserve code" for volume persistence

### Cloudflare R2 (prod only)

Install `@strapi/provider-upload-aws-s3`, configure with R2 endpoint + credentials.

---

## Task 8: Main Page CMS

### Strapi Single Type: `Main Page`

**Hero Section component:**

| Field | Type | Required |
|-------|------|----------|
| `heading` | Short text | Yes |
| `subheading` | Long text | Yes |
| `primary_cta_text` | Short text | Yes |
| `primary_cta_link` | Short text | Yes |
| `secondary_cta_text` | Short text | No |
| `secondary_cta_link` | Short text | No |
| `background_image` | Single media | No |
| `is_active` | Boolean | Yes (default: false) |

**FAQ Item component (repeatable):**

| Field | Type |
|-------|------|
| `question` | Short text |
| `answer` | Rich text |

### Frontend Logic

```
if (mainPage.heroSection?.isActive) {
  render custom hero
  all conferences -> grid
} else {
  first conference -> hero (current behavior)
  rest -> grid
}

if (mainPage.faqItems.length > 0) {
  render FAQ from Strapi
} else {
  hide FAQ section
}
```

### Data Layer

```ts
// lib/data/main-page.ts
interface HeroSection { ... }
interface FaqItem { ... }
interface MainPage { heroSection: HeroSection | null; faqItems: FaqItem[]; }
export async function getMainPage(): Promise<MainPage | null>
```

---

## Owner Tasks (noted, not implemented by AI)

1. Migrate AWS to bigger Lightsail (FIRST PRIORITY)
2. Set up staging environment
3. Branch protection on staging + main
4. Uptime Kuma on Coolify

---

## Testing Strategy

Each task includes TDD:
- Price fix: update existing price tests, verify no division
- Additional guests: update children validation tests, add dining pass opt-in tests
- Dining pass: new tests for pass selection, price calculation, step visibility
- Images: test data layer mapping, test portrait fallback logic
- Main page: test hero override logic, test FAQ rendering
- Realtime: integration test for subscription hook
