# Session 4: Platform Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dining passes, rename children to additional guests, fix room pricing, add conference image variants, CMS-managed home page, real-time payment updates, Strapi monorepo setup, and Stripe auto-invoicing.

**Architecture:** Strapi monorepo first (local dev), then Strapi schema changes, then Next.js frontend updates. Each task is testable in isolation. TDD for all business logic.

**Tech Stack:** Next.js 16, Strapi v5, Supabase (Postgres + Realtime), Stripe, Tailwind 4, Zustand, Vitest

---

## Model Selection Guide

Each phase specifies which model to use. This is deliberate -- do not override.

| Phase | Model | Why |
|-------|-------|-----|
| 1 (Strapi Monorepo) | **Sonnet** | Mechanical scaffolding, Docker boilerplate, no business logic |
| 2 (Strapi Schema) | **Sonnet** | Admin Panel click-through + pattern-following data layer files |
| 3 (Price Fix) | **Opus** | High-risk cross-cutting change across 7+ files, invitation recalc edge cases |
| 4 (Additional Guests) | **Opus** | Type rename across store/validation/API/UI layers, backward compat aliases |
| 5 (Dining Pass Flow) | **Opus** | Most complex feature: new page + store + migration + API + conditional step logic |
| 6 (Conference Images) | **Sonnet** | Straightforward data layer extension + standard HTML, reuses existing components |
| 7 (Main Page CMS) | **Sonnet** | New data layer follows established patterns, conditional rendering |
| 8 (Realtime Payments) | **Opus** | useEffect lifecycle nuances, channel cleanup race conditions, RLS + Realtime interaction |
| 9 (Stripe Config) | **None** | Owner task: 3 toggles in Stripe Dashboard |

**Rule:** When starting a phase, switch to the specified model before writing any code. Sonnet phases should not be run on Opus (wasteful). Opus phases must not be run on Sonnet (will miss cross-file ripple effects).

---

## Phase 1: Strapi Monorepo (Task 7) -- MODEL: Sonnet

> **Blocked on:** Owner migrating AWS to bigger Lightsail instance. Owner will copy live Strapi to local first.
> **Why Sonnet:** Mechanical scaffolding. Create files, write Docker configs, install a plugin. No complex business logic.

### Task 1.1: Scaffold Strapi App

**Files:**
- Create: `strapi/` (entire directory via `npx create-strapi@latest`)

**Step 1: Create Strapi app in repo**

```bash
cd /Users/donellmtabvuri/WebstormProjects/rh-booking
npx create-strapi@latest strapi --quickstart --no-run
```

This creates a `strapi/` subfolder with a fresh Strapi v5 app.

**Step 2: Verify structure exists**

```bash
ls strapi/src strapi/config strapi/package.json
```

Expected: directories and file exist.

**Step 3: Commit**

```bash
git add strapi/
git commit -m "chore(strapi): scaffold Strapi v5 app in monorepo"
```

---

### Task 1.2: Add Dockerfile

**Files:**
- Create: `strapi/Dockerfile`

**Step 1: Write Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 1337
CMD ["npm", "start"]
```

**Step 2: Verify Dockerfile syntax**

```bash
docker build --dry-run -f strapi/Dockerfile strapi/ 2>&1 | head -5
```

**Step 3: Commit**

```bash
git add strapi/Dockerfile
git commit -m "chore(strapi): add production Dockerfile"
```

---

### Task 1.3: Add Docker Compose Files

**Files:**
- Create: `strapi/docker-compose.dev.yml`
- Create: `strapi/docker-compose.staging.yml`
- Create: `strapi/docker-compose.prod.yml`
- Create: `strapi/.env.example`

**Step 1: Write docker-compose.dev.yml**

```yaml
services:
  strapi:
    build: .
    restart: unless-stopped
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: strapi-db
      DATABASE_PORT: 5432
      DATABASE_NAME: ${DATABASE_NAME:-strapi_dev}
      DATABASE_USERNAME: ${DATABASE_USERNAME:-strapi}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-strapi_dev_pass}
      APP_KEYS: ${APP_KEYS}
      API_TOKEN_SALT: ${API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      TRANSFER_TOKEN_SALT: ${TRANSFER_TOKEN_SALT}
      NODE_ENV: development
    volumes:
      - ./src:/app/src
      - ./config:/app/config
      - strapi-uploads:/app/public/uploads
    ports:
      - "1337:1337"
    depends_on:
      - strapi-db

  strapi-db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-strapi_dev}
      POSTGRES_USER: ${DATABASE_USERNAME:-strapi}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-strapi_dev_pass}
    volumes:
      - strapi-db-data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

volumes:
  strapi-db-data:
  strapi-uploads:
```

**Step 2: Write docker-compose.staging.yml**

```yaml
services:
  strapi:
    build: .
    restart: unless-stopped
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: ${DATABASE_HOST}
      DATABASE_PORT: ${DATABASE_PORT:-5432}
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      APP_KEYS: ${APP_KEYS}
      API_TOKEN_SALT: ${API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      TRANSFER_TOKEN_SALT: ${TRANSFER_TOKEN_SALT}
      NODE_ENV: production
    volumes:
      - strapi-uploads:/app/public/uploads
    ports:
      - "1337:1337"

volumes:
  strapi-uploads:
```

**Step 3: Write docker-compose.prod.yml**

Same as staging but with R2 upload provider config:

```yaml
services:
  strapi:
    build: .
    restart: unless-stopped
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: ${DATABASE_HOST}
      DATABASE_PORT: ${DATABASE_PORT:-5432}
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      APP_KEYS: ${APP_KEYS}
      API_TOKEN_SALT: ${API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      TRANSFER_TOKEN_SALT: ${TRANSFER_TOKEN_SALT}
      CF_R2_ACCESS_KEY_ID: ${CF_R2_ACCESS_KEY_ID}
      CF_R2_SECRET_ACCESS_KEY: ${CF_R2_SECRET_ACCESS_KEY}
      CF_R2_BUCKET: ${CF_R2_BUCKET}
      CF_R2_ENDPOINT: ${CF_R2_ENDPOINT}
      CF_R2_PUBLIC_URL: ${CF_R2_PUBLIC_URL}
      NODE_ENV: production
    ports:
      - "1337:1337"
```

**Step 4: Write .env.example**

```env
# Database
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=change_me

# Strapi secrets (generate with: openssl rand -base64 32)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=change_me
ADMIN_JWT_SECRET=change_me
JWT_SECRET=change_me
TRANSFER_TOKEN_SALT=change_me

# R2 (prod only)
CF_R2_ACCESS_KEY_ID=
CF_R2_SECRET_ACCESS_KEY=
CF_R2_BUCKET=
CF_R2_ENDPOINT=
CF_R2_PUBLIC_URL=
```

**Step 5: Commit**

```bash
git add strapi/docker-compose.*.yml strapi/.env.example
git commit -m "chore(strapi): add Docker Compose files for dev/staging/prod"
```

---

### Task 1.4: Configure R2 Upload Provider (prod only)

**Files:**
- Modify: `strapi/config/plugins.ts`
- Modify: `strapi/package.json` (add `@strapi/provider-upload-aws-s3`)

**Step 1: Install S3-compatible upload provider**

```bash
cd strapi && npm install @strapi/provider-upload-aws-s3
```

**Step 2: Configure plugins.ts for conditional R2**

```ts
// strapi/config/plugins.ts
export default ({ env }) => ({
  ...(env("CF_R2_ACCESS_KEY_ID")
    ? {
        upload: {
          config: {
            provider: "@strapi/provider-upload-aws-s3",
            providerOptions: {
              accessKeyId: env("CF_R2_ACCESS_KEY_ID"),
              secretAccessKey: env("CF_R2_SECRET_ACCESS_KEY"),
              endpoint: env("CF_R2_ENDPOINT"),
              params: { Bucket: env("CF_R2_BUCKET") },
              s3ForcePathStyle: true,
            },
            actionOptions: {
              upload: {},
              uploadStream: {},
              delete: {},
            },
          },
        },
      }
    : {}),
});
```

Only activates when R2 env vars are set (prod). Dev/staging fall back to local uploads.

**Step 3: Commit**

```bash
git add strapi/config/plugins.ts strapi/package.json strapi/package-lock.json
git commit -m "feat(strapi): add Cloudflare R2 upload provider for production"
```

---

### Task 1.5: Import Live Strapi Data

> **Owner task:** Copy content types and data from live server.

**Steps for owner:**

1. SSH into live Coolify server
2. Run `strapi export` inside the running Strapi container to create a backup file
3. Copy the export file to local machine
4. Start local Strapi: `cd strapi && docker compose -f docker-compose.dev.yml up -d`
5. Run `strapi import` with the backup file
6. Verify content types match live: conferences, room types, merch items, pickup locations

**Required env vars from live server:**
- `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`
- Copy these to local `.env` file in `strapi/`

---

## Phase 2: Strapi Schema Changes (Tasks 3, 8, 1) -- MODEL: Sonnet

> **Prerequisite:** Phase 1 complete, local Strapi running.
> **Why Sonnet:** Click-through content type creation in Strapi Admin Panel. Data layer files follow exact same patterns as existing rooms.ts and merch.ts.

### Task 2.1: Add Conference Image Fields (Task 3)

**Where:** Strapi Admin Panel (http://localhost:1337/admin)

**Steps:**

1. Go to Content-Type Builder -> Conference
2. Add field: `portrait_image` (Media, Single media)
   - Label: "Portrait Image (3:4)"
   - Description: "Optional portrait-optimized image for mobile viewing"
3. Add field: `other_images` (Media, Multiple media)
   - Label: "Gallery Images"
   - Description: "Additional event images for the gallery carousel"
4. Save the content type

**Verification:** The `src/api/conference/` schema files should update automatically.

**Commit:**

```bash
cd strapi && git add src/api/conference/
git commit -m "feat(strapi): add portrait_image and other_images to Conference"
```

---

### Task 2.2: Create Main Page Single Type (Task 8)

**Where:** Strapi Admin Panel

**Steps:**

1. Go to Content-Type Builder -> Create new single type
2. Name: "Main Page" (API ID: `main-page`)
3. Add component: "Hero Section" (create new component, category: "sections")
   - `heading` (Short text, required)
   - `subheading` (Long text, required)
   - `primary_cta_text` (Short text, required)
   - `primary_cta_link` (Short text, required)
   - `secondary_cta_text` (Short text, NOT required)
   - `secondary_cta_link` (Short text, NOT required)
   - `background_image` (Media, Single media, NOT required)
   - `is_active` (Boolean, default: false)
4. Add the Hero Section component to Main Page as a single component field
5. Add component: "FAQ Item" (create new component, category: "sections")
   - `question` (Short text, required)
   - `answer` (Rich text, required)
6. Add the FAQ Item component to Main Page as a repeatable component field named `faq_section`
7. Save

**Commit:**

```bash
cd strapi && git add src/api/main-page/ src/components/
git commit -m "feat(strapi): add Main Page single type with hero and FAQ"
```

---

### Task 2.3: Create Dining Pass Collection (Task 1)

**Where:** Strapi Admin Panel

**Steps:**

1. Go to Content-Type Builder -> Create new collection type
2. Name: "Dining Pass" (API ID: `dining-pass`)
3. Add fields:
   - `name` (Short text, required) - e.g. "Full Dining Pass"
   - `description` (Long text, NOT required)
   - `price` (Number, integer, required) - in cents
   - `meals_covered` (Number, integer, required) - e.g. 6
   - `conferences` (Relation, many-to-many with Conference)
4. Save

**Verification:**
- Go to Content Manager -> Dining Pass -> Create New Entry
- Fill in test data: name="Full Dining Pass", price=12000, meals_covered=6
- Link to the test conference
- Publish it

**Commit:**

```bash
cd strapi && git add src/api/dining-pass/
git commit -m "feat(strapi): add Dining Pass collection with conference relation"
```

---

### Task 2.4: Set Strapi API Permissions

**Where:** Strapi Admin Panel -> Settings -> Roles -> Public

**Steps:**

1. For "Dining Pass": enable `find` and `findOne`
2. For "Main Page": enable `find`
3. Save

**No commit needed** (permissions are stored in DB, not code).

---

## Phase 3: Price Fix (Task 4) -- MODEL: Opus

> **Why Opus:** High-risk business logic change touching 7+ files across 4 layers (utility, component, API route, data layer). The invitation recalculation logic is the trickiest part -- Opus traces the full flow and catches edge cases like children surcharge interaction with invitation acceptance. Sonnet would fix obvious callers but miss the invitation ripple effect.

### Task 3.1: Update Price Tests (TDD - write failing tests first)

**Files:**
- Modify: `lib/utils/price.test.ts`

**Step 1: Rewrite price tests to reflect new business rule**

The price in Strapi IS the per-person price. No division needed.

```ts
import { describe, it, expect } from "vitest";
import { calculateRoomAvailability } from "./price";

describe("calculateRoomAvailability", () => {
  it("10 total, 3 booked = 7 remaining", () => {
    expect(calculateRoomAvailability(10, 3)).toBe(7);
  });

  it("10 total, 10 booked = 0 remaining (sold out)", () => {
    expect(calculateRoomAvailability(10, 10)).toBe(0);
  });

  it("10 total, 0 booked = 10 remaining", () => {
    expect(calculateRoomAvailability(10, 0)).toBe(10);
  });
});
```

The `calculatePerPersonPrice` tests are removed because the function is being removed.

**Step 2: Run tests**

```bash
npm test -- lib/utils/price.test.ts
```

Expected: Tests may fail because `calculatePerPersonPrice` is still exported and imported elsewhere. We'll fix this in the next step.

**Step 3: Commit test changes**

```bash
git add lib/utils/price.test.ts
git commit -m "test(price): update tests for per-person pricing (no division)"
```

---

### Task 3.2: Remove calculatePerPersonPrice

**Files:**
- Modify: `lib/utils/price.ts` - remove `calculatePerPersonPrice`
- Modify: `components/booking/RoomTypeCard.tsx` - use `price` directly
- Modify: `app/book/[conferenceId]/children/ChildrenPageClient.tsx` - use `room.price` directly
- Modify: `app/book/[conferenceId]/confirm/ConfirmPageClient.tsx` - use `room.price` directly
- Modify: `app/api/bookings/route.ts` - use room price directly
- Modify: `lib/data/invitations.ts` - fix price recalculation

**Step 1: Remove function from price.ts**

```ts
// lib/utils/price.ts - ENTIRE FILE
export function calculateRoomAvailability(totalAvailable: number, bookedCount: number): number {
  return totalAvailable - bookedCount;
}
```

**Step 2: Fix RoomTypeCard.tsx**

Remove the import of `calculatePerPersonPrice` and the `maxOccupants` map. Use `price` directly:

```tsx
// Line 43: Change from:
const perPerson = calculatePerPersonPrice(price, maxOccupants[type]);
// To:
const perPerson = price;
```

Remove unused imports: `calculatePerPersonPrice`, `maxOccupants` map.

**Step 3: Fix ChildrenPageClient.tsx**

```tsx
// Line 45: Change from:
const perPersonRate = calculatePerPersonPrice(room?.price ?? 30000, maxOccupants);
// To:
const perPersonRate = room?.price ?? 30000;
```

Remove: `calculatePerPersonPrice` import, `maxOccupantsMap` (if unused elsewhere in this file - check first, it's used for step count logic so keep it).

**Step 4: Fix ConfirmPageClient.tsx**

```tsx
// Line 67: Change from:
const perPerson = calculatePerPersonPrice(room?.price ?? 30000, maxOccupants);
// To:
const perPerson = room?.price ?? 30000;
```

Remove: `calculatePerPersonPrice` import.

**Step 5: Fix bookings route.ts**

This is the most important fix. The API route currently hardcodes $300 and divides:

```ts
// Lines 58-62: Change from:
const roomPrice = 30000;
const maxOccupants = maxOccupantsMap[body.roomType] ?? 2;
const perPerson = calculatePerPersonPrice(roomPrice, maxOccupants);
const surcharge = calculateChildrenSurcharge(children ?? [], perPerson);
const totalPrice = perPerson + surcharge;

// To: Fetch actual price from Strapi
```

The route needs to fetch the room price from Strapi. Add room price to the request body (sent from client which already has it):

```ts
const { conferenceId, roomTypeId, bedPreference, children, roomPrice } = body;

if (!conferenceId || !roomTypeId || !bedPreference || !roomPrice) {
  return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
}

// ... (room group creation stays the same)

const perPerson = roomPrice; // price from Strapi, already per-person
const surcharge = calculateChildrenSurcharge(children ?? [], perPerson);
const totalPrice = perPerson + surcharge;
```

Remove: `calculatePerPersonPrice` import, `maxOccupantsMap` (keep if still needed for room group creation).

**Step 6: Fix ConfirmPageClient.tsx handleConfirm to send roomPrice**

```tsx
body: JSON.stringify({
  conferenceId,
  roomTypeId: selectedRoomTypeId,
  roomType: room?.type ?? "shared-2",
  bedPreference,
  children,
  invitedRoommateId,
  roomPrice: room?.price ?? 0, // ADD THIS
}),
```

**Step 7: Fix invitations.ts acceptInvitation**

The current logic in `acceptInvitation` (lines 130-140) tries to reverse-engineer the room total price by multiplying first booking's total by occupant count, then redividing. With per-person pricing, this is wrong.

New logic: When someone accepts, their per-person price is the same as the room type price. No recalculation of existing bookings needed because each person already pays the per-person rate.

```ts
// In acceptInvitation, replace lines 123-165 with:

// The room price is already per-person, so the new occupant pays the same rate
// We need the room price from Strapi, but we can read it from an existing booking
const { data: firstBooking } = await supabase
  .from("bookings")
  .select("total_price")
  .eq("room_group_id", roomGroup.id)
  .eq("status", "confirmed")
  .limit(1)
  .single();

// New occupant pays same per-person rate (no children surcharge for invitee initially)
const perPersonPrice = firstBooking?.total_price ?? 0;

await supabase
  .from("invitations")
  .update({ status: "accepted" })
  .eq("id", id);

await supabase
  .from("bookings")
  .insert({
    user_id: inviteeId,
    room_group_id: roomGroup.id,
    conference_id: roomGroup.conference_id,
    total_price: perPersonPrice,
    amount_paid: 0,
    status: "confirmed",
  });

// No need to recalculate existing bookings - each person's price is independent
```

**Step 8: Run all tests**

```bash
npm test
```

Expected: All pass. The price tests no longer test division. Children surcharge tests still work because they take `perPersonRate` as input.

**Step 9: Commit**

```bash
git add lib/utils/price.ts lib/utils/price.test.ts components/booking/RoomTypeCard.tsx
git add app/book/[conferenceId]/children/ChildrenPageClient.tsx
git add app/book/[conferenceId]/confirm/ConfirmPageClient.tsx
git add app/api/bookings/route.ts lib/data/invitations.ts
git commit -m "fix(price): room price is per-person, remove division logic"
```

---

## Phase 4: Additional Guests (Task 2) -- MODEL: Opus

> **Why Opus:** Refactors Zustand store type, validation schema, surcharge function interface, children page UI, DB migration, and bookings API child insertion in one coherent change. Opus holds the full picture of the type rename (ChildEntry -> AdditionalGuest) across store/validation/API/UI layers without drift.

### Task 4.1: Update Validation Schema

**Files:**
- Modify: `lib/validations/children.ts`
- Modify: `lib/validations/children.test.ts`

**Step 1: Write failing test for new schema**

```ts
// lib/validations/children.test.ts
import { describe, it, expect } from "vitest";
import { additionalGuestSchema, additionalGuestsSchema } from "./children";

describe("additionalGuestSchema", () => {
  it("valid: age 5, no dining pass", () => {
    const result = additionalGuestSchema.safeParse({ age: 5, diningPassId: null });
    expect(result.success).toBe(true);
  });

  it("valid: age 14, with dining pass", () => {
    const result = additionalGuestSchema.safeParse({ age: 14, diningPassId: "abc123" });
    expect(result.success).toBe(true);
  });

  it("invalid: age 0", () => {
    const result = additionalGuestSchema.safeParse({ age: 0, diningPassId: null });
    expect(result.success).toBe(false);
  });

  it("invalid: age 18", () => {
    const result = additionalGuestSchema.safeParse({ age: 18, diningPassId: null });
    expect(result.success).toBe(false);
  });
});

describe("additionalGuestsSchema", () => {
  it("valid: array of guests", () => {
    const result = additionalGuestsSchema.safeParse([
      { age: 5, diningPassId: null },
      { age: 14, diningPassId: "abc" },
    ]);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- lib/validations/children.test.ts
```

Expected: FAIL (additionalGuestSchema doesn't exist yet).

**Step 3: Update schema**

```ts
// lib/validations/children.ts
import { z } from "zod";

export const additionalGuestSchema = z.object({
  age: z.number().int().min(1, "Age must be at least 1").max(17, "Must be under 18"),
  diningPassId: z.string().nullable(),
});

export const additionalGuestsSchema = z.array(additionalGuestSchema);

export type AdditionalGuestFormData = z.infer<typeof additionalGuestSchema>;

// Keep old exports for backward compatibility during migration
export const childSchema = additionalGuestSchema;
export const childrenSchema = additionalGuestsSchema;
export type ChildFormData = AdditionalGuestFormData;
```

**Step 4: Run tests**

```bash
npm test -- lib/validations/children.test.ts
```

Expected: All pass.

**Step 5: Commit**

```bash
git add lib/validations/children.ts lib/validations/children.test.ts
git commit -m "feat(guests): update validation schema for additional guests"
```

---

### Task 4.2: Update Children Surcharge for New Interface

**Files:**
- Modify: `lib/utils/children.ts`
- Modify: `lib/utils/children.test.ts`

**Step 1: Update interface (drop gender requirement)**

```ts
// lib/utils/children.ts
import { CHILDREN_SURCHARGE_MULTIPLIER } from "@/lib/constants";

export interface GuestInput {
  age: number;
}

export function calculateGuestSurcharge(guests: GuestInput[], perPersonRate: number): number {
  const billableCount = guests.filter((g) => g.age >= 12).length;
  return billableCount * perPersonRate * CHILDREN_SURCHARGE_MULTIPLIER;
}

// Backward compat
export type ChildInput = GuestInput;
export const calculateChildrenSurcharge = calculateGuestSurcharge;
```

**Step 2: Update tests (remove gender from test data)**

```ts
// lib/utils/children.test.ts
import { describe, it, expect } from "vitest";
import { calculateGuestSurcharge } from "./children";

describe("calculateGuestSurcharge", () => {
  it("0 guests: $0 surcharge", () => {
    expect(calculateGuestSurcharge([], 15000)).toBe(0);
  });

  it("1 guest age 8: $0 surcharge", () => {
    expect(calculateGuestSurcharge([{ age: 8 }], 15000)).toBe(0);
  });

  it("1 guest age 14: surcharge = per_person_rate", () => {
    expect(calculateGuestSurcharge([{ age: 14 }], 15000)).toBe(15000);
  });

  it("2 guests (age 8, age 15): surcharge = 1 * per_person_rate", () => {
    expect(
      calculateGuestSurcharge([{ age: 8 }, { age: 15 }], 15000)
    ).toBe(15000);
  });

  it("3 guests (age 12, 13, 14): surcharge = 3 * per_person_rate", () => {
    expect(
      calculateGuestSurcharge([{ age: 12 }, { age: 13 }, { age: 14 }], 7500)
    ).toBe(22500);
  });
});
```

**Step 3: Run tests**

```bash
npm test -- lib/utils/children.test.ts
```

Expected: All pass.

**Step 4: Commit**

```bash
git add lib/utils/children.ts lib/utils/children.test.ts
git commit -m "refactor(guests): rename children surcharge to guest surcharge, drop gender"
```

---

### Task 4.3: Database Migration

**Files:**
- Create: `supabase/migrations/007_additional_guests.sql`

**Step 1: Write migration**

```sql
-- Make gender nullable for new entries (old entries keep their gender)
ALTER TABLE children ALTER COLUMN gender DROP NOT NULL;

-- Add dining pass reference
ALTER TABLE children ADD COLUMN dining_pass_id TEXT NULL;
```

**Step 2: Apply migration locally**

```bash
npx supabase db push
```

Or if using local Supabase:

```bash
npx supabase migration up
```

**Step 3: Commit**

```bash
git add supabase/migrations/007_additional_guests.sql
git commit -m "feat(db): make children.gender nullable, add dining_pass_id column"
```

---

### Task 4.4: Update Zustand Store

**Files:**
- Modify: `stores/booking-flow.ts`

**Step 1: Update store types and actions**

```ts
import { create } from "zustand";

export interface AdditionalGuest {
  age: number;
  diningPassId: string | null;
}

// Backward compat
export type ChildEntry = AdditionalGuest;

interface BookingFlowState {
  conferenceId: string | null;
  selectedRoomTypeId: string | null;
  bedPreference: "king" | "double" | null;
  guests: AdditionalGuest[];
  invitedRoommateId: string | null;
  relationshipType: "married" | "siblings" | "none" | null;
  myDiningPassId: string | null;

  setConferenceId: (id: string) => void;
  setRoomType: (id: string) => void;
  setBedPreference: (pref: "king" | "double") => void;
  addGuest: (guest: AdditionalGuest) => void;
  removeGuest: (index: number) => void;
  setGuests: (guests: AdditionalGuest[]) => void;
  setInvitee: (id: string | null, relationship?: "married" | "siblings" | "none") => void;
  setMyDiningPass: (id: string | null) => void;
  setGuestDiningPass: (index: number, id: string | null) => void;
  reset: () => void;

  // Backward compat aliases
  children: AdditionalGuest[];
  addChild: (child: AdditionalGuest) => void;
  removeChild: (index: number) => void;
  setChildren: (children: AdditionalGuest[]) => void;
}

const initialState = {
  conferenceId: null,
  selectedRoomTypeId: null,
  bedPreference: null,
  guests: [] as AdditionalGuest[],
  invitedRoommateId: null,
  relationshipType: null,
  myDiningPassId: null,
};

export const useBookingFlow = create<BookingFlowState>((set, get) => ({
  ...initialState,

  setConferenceId: (id) => set({ conferenceId: id }),
  setRoomType: (id) => set({ selectedRoomTypeId: id }),
  setBedPreference: (pref) => set({ bedPreference: pref }),
  addGuest: (guest) => set((s) => ({ guests: [...s.guests, guest] })),
  removeGuest: (index) => set((s) => ({ guests: s.guests.filter((_, i) => i !== index) })),
  setGuests: (guests) => set({ guests }),
  setInvitee: (id, relationship) => set({ invitedRoommateId: id, relationshipType: relationship ?? null }),
  setMyDiningPass: (id) => set({ myDiningPassId: id }),
  setGuestDiningPass: (index, id) =>
    set((s) => ({
      guests: s.guests.map((g, i) => (i === index ? { ...g, diningPassId: id } : g)),
    })),
  reset: () => set(initialState),

  // Backward compat
  get children() { return get().guests; },
  addChild: (child) => get().addGuest(child),
  removeChild: (index) => get().removeGuest(index),
  setChildren: (children) => get().setGuests(children),
}));
```

**Step 2: Commit**

```bash
git add stores/booking-flow.ts
git commit -m "refactor(store): rename children to guests, add dining pass state"
```

---

### Task 4.5: Update Children Page UI

**Files:**
- Modify: `app/book/[conferenceId]/children/ChildrenPageClient.tsx`

**Step 1: Update all UI labels**

Key changes:
- Heading: "Additional guests" (was "Children attending")
- Toggle label: "I have additional guests" (was "I have children attending")
- Description: "Guests under 12 stay free. Guests 12 and older are charged at the per-person room rate."
- Add button: "Add a guest" (was "Add a child")
- Remove gender selection, add dining pass toggle (only if conference has dining passes)
- Warning text: references "guest(s)" instead of "child/children"

(Full component rewrite provided in the detailed implementation - too long for plan doc. Follow the existing component structure, replace labels, remove gender field.)

**Step 2: Test manually in browser**

- Navigate to booking flow, step 2
- Verify "Additional guests" heading
- Add a guest: only age field + optional dining pass toggle
- Verify 12+ warning message uses "guest" language

**Step 3: Commit**

```bash
git add app/book/[conferenceId]/children/ChildrenPageClient.tsx
git commit -m "feat(ui): rename children to additional guests, add dining pass opt-in"
```

---

## Phase 5: Dining Pass Booking Flow (Task 1 - frontend) -- MODEL: Opus

> **Why Opus:** Most complex new feature in Session 4. Touches: new server page, new client component, Zustand store extensions, Supabase migration + RLS, bookings API modification, confirm page price breakdown update, dynamic step count logic across 4 existing pages. Opus handles multi-layer coordination and conditional visibility (pass exists? show step, adjust numbering; no pass? hide step entirely).

### Task 5.1: Dining Pass Data Layer

**Files:**
- Create: `lib/data/dining-passes.ts`

**Step 1: Write data layer**

```ts
import { strapiGet } from "@/lib/strapi";

export interface DiningPass {
  id: string;
  documentId: string;
  name: string;
  description: string | null;
  price: number;
  mealsCovered: number;
}

interface StrapiDiningPassItem {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
  price: number;
  meals_covered: number;
}

function mapDiningPass(item: StrapiDiningPassItem): DiningPass {
  return {
    id: item.documentId,
    documentId: item.documentId,
    name: item.name,
    description: item.description,
    price: item.price,
    mealsCovered: item.meals_covered,
  };
}

export async function getDiningPassesForConference(conferenceId: string): Promise<DiningPass[]> {
  try {
    const result = await strapiGet<StrapiDiningPassItem[]>("/api/dining-passes", {
      "filters[conferences][documentId][$eq]": conferenceId,
      "publicationState": "live",
    });
    return result.data.map(mapDiningPass);
  } catch {
    return [];
  }
}
```

**Step 2: Commit**

```bash
git add lib/data/dining-passes.ts
git commit -m "feat(data): add dining pass data layer"
```

---

### Task 5.2: Dining Pass Supabase Migration

**Files:**
- Create: `supabase/migrations/008_booking_dining_passes.sql`

**Step 1: Write migration**

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

-- RLS
ALTER TABLE booking_dining_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dining passes"
  ON booking_dining_passes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_dining_passes.booking_id
    AND bookings.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own dining passes"
  ON booking_dining_passes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_dining_passes.booking_id
    AND bookings.user_id = auth.uid()
  ));

GRANT SELECT, INSERT, DELETE ON booking_dining_passes TO authenticated;
```

**Step 2: Apply migration**

```bash
npx supabase migration up
```

**Step 3: Commit**

```bash
git add supabase/migrations/008_booking_dining_passes.sql
git commit -m "feat(db): add booking_dining_passes table with RLS"
```

---

### Task 5.3: Dining Pass Booking Step Page

**Files:**
- Create: `app/book/[conferenceId]/dining/page.tsx` (server component)
- Create: `app/book/[conferenceId]/dining/DiningPassClient.tsx` (client component)

**Step 1: Write server page**

```tsx
// app/book/[conferenceId]/dining/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDiningPassesForConference } from "@/lib/data/dining-passes";
import { DiningPassClient } from "./DiningPassClient";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{ conferenceId: string }>;
}

export default async function DiningPassPage({ params }: PageProps): Promise<React.ReactElement> {
  const { conferenceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const diningPasses = await getDiningPassesForConference(conferenceId);

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-4">
        <XIcon size={14} /> Exit
      </Link>
      <div className="max-w-2xl mx-auto">
        <DiningPassClient conferenceId={conferenceId} diningPasses={diningPasses} />
      </div>
    </main>
  );
}
```

**Step 2: Write client component**

The client component shows dining pass tier cards. Each person (booker + guests) can independently select a tier or skip. Uses the Zustand store.

(Full implementation follows existing booking step patterns: StepIndicator, card selection, Back/Continue buttons.)

**Step 3: Update step navigation**

In `ChildrenPageClient.tsx`, change the "Continue" navigation:
- If dining passes exist for the conference: go to `/book/${conferenceId}/dining`
- If no dining passes: go to roommate or confirm (current behavior)

In `DiningPassClient.tsx`, "Continue" goes to roommate or confirm.

**Step 4: Update StepIndicator labels**

When dining passes exist:
- Private: `["Room", "Guests", "Dining", "Confirm"]` (4 steps)
- Shared: `["Room", "Guests", "Dining", "Roommate", "Confirm"]` (5 steps)

When no dining passes:
- Private: `["Room", "Guests", "Confirm"]` (3 steps)
- Shared: `["Room", "Guests", "Roommate", "Confirm"]` (4 steps)

**Step 5: Test manually**

- Create a Dining Pass in Strapi linked to the test conference
- Go through booking flow, verify dining step appears
- Remove/unpublish the dining pass, verify step is skipped

**Step 6: Commit**

```bash
git add app/book/[conferenceId]/dining/
git commit -m "feat(booking): add Dining Pass selection step"
```

---

### Task 5.4: Update Booking API to Include Dining Passes

**Files:**
- Modify: `app/api/bookings/route.ts`

**Step 1: Accept dining pass selections in POST body**

```ts
const { conferenceId, roomTypeId, bedPreference, children, roomPrice, 
        myDiningPassId, myDiningPassName, myDiningPassPrice,
        guestDiningPasses } = body;
```

**Step 2: Add dining pass cost to total**

```ts
let diningTotal = 0;
if (myDiningPassPrice) diningTotal += myDiningPassPrice;
if (guestDiningPasses) {
  for (const gp of guestDiningPasses) {
    if (gp?.price) diningTotal += gp.price;
  }
}
const totalPrice = perPerson + surcharge + diningTotal;
```

**Step 3: Insert dining pass records after booking creation**

```ts
const diningRows = [];
if (myDiningPassId) {
  diningRows.push({
    booking_id: booking.id,
    dining_pass_id: myDiningPassId,
    dining_pass_name: myDiningPassName,
    price: myDiningPassPrice,
    for_guest_index: null,
  });
}
if (guestDiningPasses) {
  guestDiningPasses.forEach((gp, index) => {
    if (gp?.id) {
      diningRows.push({
        booking_id: booking.id,
        dining_pass_id: gp.id,
        dining_pass_name: gp.name,
        price: gp.price,
        for_guest_index: index,
      });
    }
  });
}
if (diningRows.length > 0) {
  await supabase.from("booking_dining_passes").insert(diningRows);
}
```

**Step 4: Commit**

```bash
git add app/api/bookings/route.ts
git commit -m "feat(api): include dining pass in booking creation and pricing"
```

---

### Task 5.5: Update Confirm Page to Show Dining Passes

**Files:**
- Modify: `app/book/[conferenceId]/confirm/ConfirmPageClient.tsx`

**Step 1: Read dining pass selections from store and show in price breakdown**

Add a "Dining Pass" row in the price breakdown:

```tsx
{myDiningPassId && (
  <div className="flex justify-between text-sm">
    <span className="text-muted">Dining Pass (You)</span>
    <span>${(myDiningPassPrice / 100).toFixed(2)}</span>
  </div>
)}
{/* Guest dining passes */}
```

**Step 2: Commit**

```bash
git add app/book/[conferenceId]/confirm/ConfirmPageClient.tsx
git commit -m "feat(ui): show dining pass in booking confirmation breakdown"
```

---

## Phase 6: Conference Images + Carousel (Task 3 - frontend) -- MODEL: Sonnet

> **Why Sonnet:** Straightforward frontend work. Data layer extension follows existing patterns. `<picture>` element is standard HTML. Gallery reuses existing ImageSlider + ImageLightbox components. No business logic complexity.

### Task 6.1: Update Conference Data Layer

**Files:**
- Modify: `lib/data/conferences.ts`

**Step 1: Add new fields to interfaces**

```ts
export interface Conference {
  // ... existing
  portraitImageUrl: string | null;
  otherImageUrls: string[];
}

interface StrapiConferenceItem {
  // ... existing
  portrait_image: { url: string } | null;
  other_images: { url: string }[] | null;
}
```

**Step 2: Update mapConference**

```ts
function mapConference(item: StrapiConferenceItem): Conference {
  return {
    // ... existing fields
    portraitImageUrl: resolveImageUrl(item.portrait_image?.url),
    otherImageUrls: (item.other_images ?? [])
      .map((img) => resolveImageUrl(img.url))
      .filter((url): url is string => url !== null),
  };
}
```

**Step 3: Update Strapi queries to populate new fields**

In `getConferences`:
```ts
"populate": "image,portrait_image,other_images",
```

**Step 4: Commit**

```bash
git add lib/data/conferences.ts
git commit -m "feat(data): add portrait image and gallery images to Conference"
```

---

### Task 6.2: Responsive Hero Image

**Files:**
- Modify: `app/(marketing)/conferences/[slug]/page.tsx`
- Modify: `app/(marketing)/page.tsx`

**Step 1: Update conference detail hero**

Replace the single `<Image>` with a `<picture>` element:

```tsx
<picture>
  {conference.portraitImageUrl && (
    <source media="(max-width: 768px)" srcSet={conference.portraitImageUrl} />
  )}
  <Image
    src={conference.imageUrl ?? ""}
    alt={conference.name}
    fill
    className="object-cover"
    unoptimized
    priority
  />
</picture>
```

**Step 2: Same for landing page hero**

**Step 3: Commit**

```bash
git add app/(marketing)/conferences/[slug]/page.tsx app/(marketing)/page.tsx
git commit -m "feat(ui): responsive portrait/landscape hero images"
```

---

### Task 6.3: Gallery Carousel

**Files:**
- Modify: `app/(marketing)/conferences/[slug]/page.tsx`

**Step 1: Add gallery section below info cards**

```tsx
{conference.otherImageUrls.length > 0 && (
  <section className="mb-10">
    <h2 className="font-heading text-xl font-semibold mb-4">Event Gallery</h2>
    <ImageSlider
      images={conference.otherImageUrls}
      alt={`${conference.name} gallery`}
      className="h-64 md:h-80 rounded-2xl"
    />
  </section>
)}
```

**Step 2: Test with images uploaded in Strapi**

**Step 3: Commit**

```bash
git add app/(marketing)/conferences/[slug]/page.tsx
git commit -m "feat(ui): add event gallery carousel on conference detail page"
```

---

## Phase 7: Main Page CMS (Task 8 - frontend) -- MODEL: Sonnet

> **Why Sonnet:** New data layer file follows established pattern (strapiGet + interface mapping). Landing page changes are conditional rendering (if/else hero override). No edge cases needing Opus-level reasoning.

### Task 7.1: Main Page Data Layer

**Files:**
- Create: `lib/data/main-page.ts`

**Step 1: Write data layer**

```ts
import { strapiGet } from "@/lib/strapi";

export interface HeroSection {
  heading: string;
  subheading: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  backgroundImageUrl: string | null;
  isActive: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface MainPage {
  heroSection: HeroSection | null;
  faqItems: FaqItem[];
}

function resolveImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;
}

export async function getMainPage(): Promise<MainPage | null> {
  try {
    const result = await strapiGet<{
      hero_section: {
        heading: string;
        subheading: string;
        primary_cta_text: string;
        primary_cta_link: string;
        secondary_cta_text: string | null;
        secondary_cta_link: string | null;
        background_image: { url: string } | null;
        is_active: boolean;
      } | null;
      faq_section: { question: string; answer: string }[] | null;
    }>("/api/main-page", {
      "populate": "hero_section.background_image,faq_section",
    });

    const data = result.data;
    return {
      heroSection: data.hero_section
        ? {
            heading: data.hero_section.heading,
            subheading: data.hero_section.subheading,
            primaryCtaText: data.hero_section.primary_cta_text,
            primaryCtaLink: data.hero_section.primary_cta_link,
            secondaryCtaText: data.hero_section.secondary_cta_text ?? null,
            secondaryCtaLink: data.hero_section.secondary_cta_link ?? null,
            backgroundImageUrl: resolveImageUrl(data.hero_section.background_image?.url),
            isActive: data.hero_section.is_active,
          }
        : null,
      faqItems: (data.faq_section ?? []).map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    };
  } catch {
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add lib/data/main-page.ts
git commit -m "feat(data): add main page data layer for hero and FAQ"
```

---

### Task 7.2: Update Landing Page

**Files:**
- Modify: `app/(marketing)/page.tsx`

**Step 1: Fetch main page data**

```ts
import { getMainPage } from "@/lib/data/main-page";

// In Home():
const [conferences, mainPage] = await Promise.all([
  getConferences(),
  getMainPage(),
]);

const useCustomHero = mainPage?.heroSection?.isActive ?? false;
const hero = useCustomHero ? null : (conferences[0] ?? null);
const conferenceList = useCustomHero ? conferences : conferences.slice(1);
```

**Step 2: Render custom hero when active**

```tsx
{useCustomHero && mainPage?.heroSection ? (
  <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-end">
    {mainPage.heroSection.backgroundImageUrl ? (
      <Image src={mainPage.heroSection.backgroundImageUrl} alt="" fill className="object-cover" unoptimized priority />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface-secondary to-surface-tertiary" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
      <div className="max-w-2xl animate-fade-up">
        <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-4">
          {mainPage.heroSection.heading}
        </h1>
        <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-lg">
          {mainPage.heroSection.subheading}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <PillButton href={mainPage.heroSection.primaryCtaLink} size="lg">
            {mainPage.heroSection.primaryCtaText}
          </PillButton>
          {mainPage.heroSection.secondaryCtaText && mainPage.heroSection.secondaryCtaLink && (
            <PillButton href={mainPage.heroSection.secondaryCtaLink} size="lg" variant="outline">
              {mainPage.heroSection.secondaryCtaText}
            </PillButton>
          )}
        </div>
      </div>
    </div>
  </section>
) : (
  /* existing conference hero */
)}
```

**Step 3: Replace hardcoded FAQ with Strapi data**

```tsx
{mainPage?.faqItems && mainPage.faqItems.length > 0 && (
  <section className="py-16 md:py-24 bg-surface-secondary">
    <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
      <h2 className="font-heading text-2xl md:text-4xl font-semibold text-center mb-3">Common questions</h2>
      <p className="text-muted text-center mb-10">Everything you need to know before you book.</p>
      <div>
        {mainPage.faqItems.map(({ question, answer }) => (
          <details key={question} className="group border-b border-border">
            <summary className="cursor-pointer py-5 font-medium text-foreground flex items-center justify-between list-none select-none">
              {question}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className="text-muted shrink-0 ml-4 transition-transform duration-200 group-open:rotate-45">
                <path d="M10 4v12M4 10h12" />
              </svg>
            </summary>
            <p className="text-muted text-[15px] leading-relaxed pb-5 pr-8 animate-slide-up">{answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
)}
```

Remove the hardcoded `FAQS` array.

**Step 4: Update Upcoming Conferences to use `conferenceList`**

```tsx
{conferenceList.length > 0 && (
  <section className="py-16 md:py-24 bg-surface-secondary">
    {/* ... use conferenceList instead of rest */}
  </section>
)}
```

**Step 5: Test**

- With no Main Page in Strapi: current behavior (conference hero + hardcoded FAQ hidden)
- With Main Page, hero isActive=false: current behavior
- With Main Page, hero isActive=true: custom hero, all conferences in grid
- With FAQ items in Strapi: FAQ renders from CMS

**Step 6: Commit**

```bash
git add app/(marketing)/page.tsx lib/data/main-page.ts
git commit -m "feat(cms): connect landing page to Strapi Main Page (hero + FAQ)"
```

---

## Phase 8: Real-time Payments (Task 6) -- MODEL: Opus

> **Why Opus:** Supabase Realtime has nuanced lifecycle management: channel creation timing, effect dependency arrays, cleanup race conditions on fast navigation, RLS interaction with Realtime filters. The hook must work correctly across 3+ pages that mount/unmount independently. Opus handles useEffect cleanup edge cases and the optimistic-vs-authoritative state pattern.

### Task 8.1: Enable Realtime on Bookings Table

**Files:**
- Create: `supabase/migrations/009_enable_realtime_bookings.sql`

**Step 1: Write migration**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
```

**Step 2: Apply**

```bash
npx supabase migration up
```

**Step 3: Commit**

```bash
git add supabase/migrations/009_enable_realtime_bookings.sql
git commit -m "feat(db): enable Supabase Realtime on bookings table"
```

---

### Task 8.2: Create usePaymentUpdates Hook

**Files:**
- Create: `lib/hooks/usePaymentUpdates.ts`

**Step 1: Write the hook**

```ts
"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function usePaymentUpdates(
  userId: string | null,
  onUpdate: (bookingId: string, amountPaid: number, totalPrice: number) => void,
): void {
  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`bookings:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { id, amount_paid, total_price } = payload.new as {
            id: string;
            amount_paid: number;
            total_price: number;
          };
          onUpdate(id, amount_paid, total_price);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
}
```

**Step 2: Commit**

```bash
git add lib/hooks/usePaymentUpdates.ts
git commit -m "feat(realtime): add usePaymentUpdates hook for live payment updates"
```

---

### Task 8.3: Integrate Realtime into PaymentCard

**Files:**
- Modify: `app/(app)/pay/PaymentCard.tsx`

**Step 1: Add realtime updates**

```tsx
import { usePaymentUpdates } from "@/lib/hooks/usePaymentUpdates";
import { useCallback, useState } from "react";

// Inside PaymentCard component:
const [currentAmountPaid, setCurrentAmountPaid] = useState(amountPaid);
const [currentTotalPrice, setCurrentTotalPrice] = useState(totalPrice);

const handleUpdate = useCallback((id: string, paid: number, total: number) => {
  if (id === bookingId) {
    setCurrentAmountPaid(paid);
    setCurrentTotalPrice(total);
  }
}, [bookingId]);

usePaymentUpdates(userId, handleUpdate);

// Use currentAmountPaid and currentTotalPrice instead of props
const remainingBalance = currentTotalPrice - currentAmountPaid;
```

The `userId` needs to be passed as a prop to PaymentCard. Update the pay page to pass it.

**Step 2: Update pay page to pass userId**

**Step 3: Test**

- Open pay page in browser
- In another tab/Stripe dashboard, mark an invoice as paid
- Verify the payment card updates without page refresh

**Step 4: Commit**

```bash
git add app/(app)/pay/PaymentCard.tsx app/(app)/pay/page.tsx
git commit -m "feat(realtime): live payment updates on pay page"
```

---

### Task 8.4: Integrate Realtime into Dashboard

**Files:**
- Modify: `app/(app)/dashboard/page.tsx` (or create a client wrapper)

Similar pattern: use `usePaymentUpdates` hook to refresh booking status cards.

**Commit:**

```bash
git commit -m "feat(realtime): live payment updates on dashboard"
```

---

## Phase 9: Stripe Configuration (Task 5) -- MODEL: None (Owner task)

No code changes. Document for the owner:

### Stripe Dashboard Settings

1. Go to **Settings -> Emails** in Stripe Dashboard
2. Under **Successful payments**: Toggle ON "Email customers for successful payments"
3. Under **Invoices**: Toggle ON "Email finalized invoices and credit notes to customers"
4. Under **Invoices**: Toggle ON "Email invoices and receipts when manually marked as paid"

These settings apply to both test and live mode independently. Enable in both.

---

## Final Checklist

After all phases complete:

```bash
# Run all tests
npm test

# Type check
npx tsc --noEmit

# Build check
npm run build

# Manual testing checklist:
# [ ] Room price shows per-person without division
# [ ] Additional guests page says "Additional guests" not "Children"
# [ ] Dining Pass step appears when passes exist for conference
# [ ] Dining Pass step is hidden when no passes exist
# [ ] Conference detail shows portrait on mobile, landscape on desktop
# [ ] Gallery carousel appears when other_images exist
# [ ] Landing page shows custom hero when Main Page isActive=true
# [ ] Landing page falls back to conference hero when isActive=false
# [ ] FAQ renders from Strapi
# [ ] Payment card updates in real-time when invoice is marked paid
# [ ] Stripe sends receipt emails after successful payments
```
