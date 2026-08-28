# RoyalHouse Booking

A church conference room booking platform for RoyalHouse Church.

## Required Reading

| File | What it covers |
|------|---------------|
| `CONTEXT.md` | This file. Project state, architecture, decisions. |
| `docs/design.md` | Design system. Colors, typography, spacing, components, interactions, page templates. |
| `docs/plans/2026-07-15-3-day-mvp-v2.md` | Implementation plan. Milestones, acceptance criteria, session prompts. |
| `AGENTS.md` | Coding conventions, patterns, testing, git workflow, what not to do. |

## Project Overview

Members register for conferences, book and share hotel rooms, manage payments in installments, and purchase merchandise. Admin manages content via Strapi CMS and payment visibility via Stripe Dashboard.

## Architecture

```
Next.js 16 (Netlify)  -->  Strapi (Coolify) : read-only content
                      -->  Supabase        : auth + transactional data
                      -->  Stripe Checkout  : payments
```

- **Next.js 16** - Frontend client on Netlify
- **Strapi** - Headless CMS on Coolify. Admin creates conferences, room types, merch items, pickup locations. Frontend reads via REST API.
- **Supabase** - Auth (email), database (profiles, bookings, invitations, children, merch orders), Edge Functions (Stripe webhooks)
- **Stripe** - Checkout (hosted payment page) for room payments and merch. stripe-sync-engine mirrors payment data to Supabase.
- **Data access layer** - `lib/data/` abstracts the source. Components never know if data comes from Strapi or Supabase.

## Tech Stack

- Next.js 16, React 19, Tailwind CSS 4, HeroUI
- Supabase (Auth + Postgres + Edge Functions + stripe-sync-engine)
- Strapi v5 (headless CMS, self-hosted on Coolify)
- Stripe Checkout
- Netlify (deployment)

## Key Decisions

- Auth is MAGIC LINK (passwordless). No passwords. User enters email, receives link, clicks to log in.
- Church branches stored in Supabase `church_branches` table (seeded, not hardcoded). ComboBox fetches from DB.
- Conference registration is SEPARATE from room booking. User can register without booking a room.
- Strapi = CMS for read-only content (conferences, rooms, merch, pickup locations). Admin panel IS the admin UI.
- Supabase = auth + transactional data (bookings, invitations, payments, profiles, children, merch orders)
- Stripe Checkout (hosted page) - no custom payment forms, no Stripe Products needed
- stripe-sync-engine mirrors payment data into Supabase for querying
- HeroUI v3 component library (built for Next.js + Tailwind)
- Admin uses Strapi panel + Stripe dashboard (no custom admin UI in MVP)
- Room prices stored in cents. Per-person price = room total / max_occupants.
- Minimum payment: $25. Deadline set per conference in Strapi.
- Children 12+ charged 1x per-person rate extra. Do NOT consume a room slot.
- Room switching blocked only when the individual user has paid in full.
- 24-hour urgency: if check-in < 24h away, payment required on booking confirmation.
- Single item merch purchase (no cart for MVP).

## Business Rules

| Rule | Detail |
|------|--------|
| Gender sharing | Opposite genders cannot share unless married or siblings |
| Relationship prompt | System asks when genders differ: married / siblings / neither |
| Search privacy | By name: shows name + phone. By phone: shows name only. Full details after invite acceptance. |
| Min payment | $25 |
| Payment deadline | Admin-set per conference (typically 1 week before) |
| Room switching | Blocked for individual once THEY have paid in full |
| Children 12+ | Charged extra, do NOT consume occupancy slot |
| Children <12 | Free, tracked in system |
| Merch | Separate payment flow, unlimited stock, open/close toggle |
| Room pricing | Split evenly among all occupants in room group |
| Bed type | Preference only, not guaranteed |
| Conference registration | Can attend without booking a room |

## Church Branches (22)

Royalhouse, CT | Victory Center; Royalhouse, DC | DC Mission; Royalhouse DE | Delaware Fellowship; Royalhouse, ATL | Miracle Life Center; Royalhouse, MA | Mt. Zion Center; Royalhouse, MD | Frederick Campus; Royalhouse MD | Grace2Grace Center; Royalhouse, NC | Bread of Life Center; Royalhouse, NC | Dunamis Center; Royalhouse, NC | Glory Center; Royalhouse, NJ | Covenant Center; Royalhouse, NY | Buffalo Fellowship; Royalhouse, NY | Kingdom Center; Royalhouse, NY | Latter Rain Center; Royalhouse, PA | Philadelphia Mission; Royalhouse, PA | Pittsburg Mission; Royalhouse, TX | Houston Mission; Royalhouse, VA | Breakthrough Center; Royalhouse, VA | Norfolk Mission; Royalhouse, WA | Washington Fellowship; Royalhouse Canada | Canada Fellowship; Royalhouse, NY | Orange & Rockland Fellowship

## Current State

- [x] Infrastructure setup
- [x] Auth working (magic link, 2-step registration, profile edit)
- [x] Marketing site + Conference pages
- [x] Strapi content seeded (conference, rooms, merch, pickup locations)
- [x] Room booking (selection + availability + price calc)
- [x] Children registration (surcharge for 12+)
- [x] Roommate flow (search + privacy rules + gender validation + invite)
- [x] Invitations accept/decline (with price recalculation)
- [x] Booking confirmation (receipt + urgency detection + finalization)
- [x] Payments (Stripe Checkout for room + merch)
- [x] Merch store (listing + detail + purchase via Stripe)
- [x] Dashboard (conferences, merch orders, profile)
- [x] Navigation + polish
- [x] Deployed (Netlify)
- [ ] Account deletion UI
- [ ] Admin notifications

## What's Done

### Session 1 (2026-07-15)
- **1.1** Project infrastructure: Next.js 16, Tailwind 4, Vitest, Supabase clients, Strapi client, data layer stubs, CI
- **1.2** Supabase schema + RLS policies + church branches seed data (22 branches)
- **1.3** Strapi content seeded: 1 conference (Kingdom Impact 2026, Aug 14-17, Atlanta GA), 3 room types (private $300, shared-2 $300, shared-4 $300), 3 merch items (t-shirt open, hoodie open, mug closed), 2 pickup locations. Conference documentId: `txnlz5bx02lkfx4h8psgkcct`.
- **1.4** Auth: magic link login, 2-step registration (name/email/phone + gender/age/branch), auth callback, profile edit page. `proxy.ts` (Next.js 16 renamed middleware). Trigger fix: `handle_new_user` uses `SET search_path = public` + guards on `full_name` presence.
- **1.5** Marketing landing page: navbar (server component, auth-aware), hero (empty state when no Strapi), How It Works, FAQ, footer. `ConferenceCard` component extracted.
- **1.6** Conference detail page: hero image + gradient, info cards, about section, registration section (auth-gated). `RegistrationForm` client component with date validation. `/api/register-conference` POST route. Booking schema with TDD tests.

### Session 2 (2026-07-16)
- **2.1** Room selection: `getRoomTypesWithAvailability()` (Strapi rooms - Supabase bookings), `calculatePerPersonPrice()`, `calculateRoomAvailability()`, Zustand booking flow store, room type cards with per-person pricing, bed preference selection. Reusable `ImageSlider` + `ImageLightbox` components with View Transitions API (`experimental.viewTransition: true` in next.config). 
- **2.2** Children registration: `calculateChildrenSurcharge()` (12+ = 1x per-person rate), Zod child schema, toggle + dynamic child rows, inline warnings for billable children, surcharge summary. Private rooms skip roommate step.
- **2.3** Roommate search: `searchRoommates()` with privacy rules (name search shows phone, phone search hides phone), `validateGenderSharing()` with relationship modal (married/siblings/none), invitation creation via `/api/invitations` POST. Debounced search UI.
- **2.4** Invitations: accept/decline via PATCH. Accept triggers price recalculation for all room group members (room_price / new_occupant_count). `/app/invitations/page.tsx` with pending cards + action buttons.
- **2.5** Booking confirmation: receipt-style breakdown (room share + children surcharge = total), 24-hour urgency detection (forces payment), `/api/bookings` POST creates room_group + booking + children atomically. Zustand store resets on confirm.

### Session 3 (2026-07-17/18)
- **3.1** Deployment: Netlify via OpenNext adapter (auto-configured).
- **3.2** Bug fixes: checkout 500 (added try/catch), registration date validation (accept ISO datetimes), hydration mismatch (LocalizedDate SSR fix), error UX (styled alert boxes with WarningCircleIcon).
- **3.3** Phone input: `PhoneInput` component with country code picker (~170 countries), auto-formatting via `libphonenumber-js`, E.164 storage. Integrated into registration + profile pages. Validation updated to `isValidPhoneNumber()`.
- **3.4** Profile gate: `/auth/complete-profile` page for users who sign in via magic link without a profile. Middleware + callback redirect if no profile row exists.
- **3.5** Account deletion: migration `005_account_deletion.sql` - cascading FKs on invitations + `delete_own_account()` RPC.
- **3.6** Email templates: redesigned magic-link + new confirm-email templates matching app design (pill button, accent gradient bar, rounded card).
- **3.7** Versioning: `commit-and-tag-version` for automated SemVer releases with CHANGELOG generation.

## What's Next

Session 4: Account deletion UI, admin notifications, production hardening

## Environment

- Strapi: https://cms.donl.me (Coolify)
- Supabase: https://mnmeropgokozniimbqzk.supabase.co
- Stripe: Test mode (dashboard.stripe.com)
- Local dev: http://localhost:3000
- Deployed: https://booking.donl.me (Netlify)

## File Structure (planned)

```
app/
  page.tsx                          # Marketing landing
  conferences/
    [id]/page.tsx                   # Conference detail + register
  auth/
    register/page.tsx
    login/page.tsx
    complete-profile/page.tsx
    callback/route.ts
  dashboard/
    page.tsx                        # User dashboard
    profile/page.tsx
  book/
    [conferenceId]/
      page.tsx                      # Room selection (Step 1)
      RoomSelectionClient.tsx
      children/page.tsx             # Children registration (Step 2)
      roommate/page.tsx             # Roommate search + invite (Step 3)
      confirm/page.tsx              # Booking confirmation (Step 4)
  pay/page.tsx                      # Payment page
  invitations/page.tsx              # Accept/decline invitations
  merch/
    page.tsx                        # Merch listing
    [id]/page.tsx                   # Merch detail
    orders/page.tsx
  api/
    register-conference/route.ts
    roommate-search/route.ts        # GET: search with privacy rules
    invitations/route.ts            # POST: create, PATCH: accept/decline
    bookings/route.ts               # POST: finalize booking
    checkout/route.ts               # Stripe Checkout session

lib/
  data/
    conferences.ts                  # Reads from Strapi
    rooms.ts                        # Reads Strapi + Supabase (availability)
    merch.ts                        # Reads from Strapi
    bookings.ts                     # Reads/writes Supabase
    payments.ts                     # Reads from Supabase (synced Stripe data)
    profiles.ts                     # Reads/writes Supabase + roommate search
    invitations.ts                  # Reads/writes Supabase (create/accept/decline)
  utils/
    price.ts                        # Per-person price + availability calc
    children.ts                     # Children surcharge calc
    gender-validation.ts            # Gender sharing rules
    search-privacy.ts               # Search type detection + privacy filter
  supabase/
    client.ts                       # Browser client
    server.ts                       # Server client
    middleware.ts                   # Auth middleware helper
  strapi.ts                         # Strapi REST client
  heroui-theme.ts                   # Custom theme
  validations/
    auth.ts                         # Registration + login schemas
    booking.ts                      # Date validation
    children.ts                     # Child entry schema
  constants/
    index.ts                        # Payment urgency, min payment, etc.

stores/
  booking-flow.ts                   # Zustand: multi-step booking wizard state

components/
  ui/
    PillButton.tsx
    Badge.tsx
    FormField.tsx
    InfoCard.tsx
    SectionHeader.tsx
    LocalizedDate.tsx                # SSR-safe date formatting
    ImageSlider.tsx                  # Reusable scroll-snap image slider
    ImageLightbox.tsx                # Reusable modal gallery with animations
  forms/
    RegistrationForm.tsx
    PhoneInput.tsx                   # Country code picker + auto-formatter
  booking/
    StepIndicator.tsx               # Step progress (1-4)
    RoomTypeCard.tsx                 # Selectable room card
  header.tsx
  mobile-nav.tsx

supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_stripe_schema.sql
    004_stripe_integration.sql
    005_account_deletion.sql
  templates/
    magic-link.html
    confirm-email.html
  functions/
    stripe-webhook/index.ts

middleware.ts                        # Route protection
CONTEXT.md                          # This file
```

## Active Gotchas

- **`proxy.ts`** — Next.js 16 renamed `middleware.ts` → `proxy.ts`, exported function must be `proxy` not `middleware`
- **Supabase trigger** — `handle_new_user()` must use `SET search_path = public` and guard on `full_name IS NOT NULL` (login OTP also fires the trigger on existing users)
- **Profile gate** — Users who sign in via magic link without registering are redirected to `/auth/complete-profile`. Middleware checks on protected routes, callback checks after login.
- **Phone numbers** — Stored as E.164 format (e.g., `+12125551234`). Validated via `libphonenumber-js`.
- **Account deletion** — `delete_own_account()` RPC cascades through all FK chains. Invitations FK fixed to CASCADE.
- **Local Supabase** — running on `http://127.0.0.1:54321`. Mailpit on `http://localhost:54324`.
- **Production env vars** — `STRIPE_SECRET_KEY` must be set in Netlify environment variables. Missing key causes checkout 500.
- **Versioning** — `commit-and-tag-version` manages `CHANGELOG.md` + tags. Use `npm run release` after commits.
