# RoyalHouse Booking

Conference room booking platform for RoyalHouse Church. Members register for conferences, book and share hotel rooms, manage payments in installments, and purchase merchandise.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in Supabase, Strapi, and Stripe credentials

# Start local Supabase (Docker required)
supabase start

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
                    ┌──────────────────────┐
                    │   Next.js 16 App     │
                    │  (Cloudflare Pages)  │
                    └──────┬───────┬───────┘
                           │       │
              reads content │       │ auth + CRUD + payments
                           ▼       ▼
                ┌──────────────┐  ┌──────────────────────────┐
                │  Strapi v5   │  │        Supabase          │
                │  (Coolify)   │  │  Auth + Postgres + RLS   │
                └──────────────┘  └────────────┬─────────────┘
                                               │
                                               │ stripe-sync-engine
                                               │ mirrors payment data
                                               ▼
                                  ┌──────────────────────────┐
                                  │    Stripe Checkout       │
                                  │    (hosted page)         │
                                  └──────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | Server-first app with client islands |
| UI | Custom components + selective HeroUI v3 | PillButton, Badge, Sidebar, etc. |
| CMS | Strapi v5 (Coolify) | Read-only content: conferences, rooms, merch, pickup locations |
| Database | Supabase Postgres + RLS | Transactional data: profiles, bookings, invitations, payments |
| Auth | Supabase Auth (magic link) | Passwordless email authentication |
| Payments | Stripe Checkout (hosted) | Room installment payments + merch single purchase |
| Sync | stripe-sync-engine | Mirrors Stripe data into Supabase for querying |

---

## Tech Stack

| Category | Tools |
|----------|-------|
| Framework | Next.js 16, React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4, CSS custom properties (oklch) |
| Components | Custom library (PillButton, Badge, FormField, etc.) |
| Forms | React Hook Form + Zod validation |
| Client state | Zustand (booking flow wizard) |
| Icons | Phosphor Icons (@phosphor-icons/react) |
| Avatars | DiceBear Thumbs (seeded by full name) |
| Dark mode | next-themes (class-based) |
| Testing | Vitest + Testing Library |
| Deployment | Cloudflare Pages (via GitHub Actions) |

---

## Project Structure

```
app/
  (marketing)/          # Public pages (landing, conferences, merch)
  (auth)/               # Login, register, callback
  (app)/                # Authenticated pages with sidebar layout
    dashboard/          # Main dashboard + sub-pages
      conferences/      # In-app conference browsing
      merch/            # In-app merch browsing + orders
      profile/          # Profile edit
    invitations/        # Accept/decline room invitations
    pay/                # Multi-conference payment management
  book/                 # Multi-step booking wizard (standalone)
    [conferenceId]/
      children/         # Step 2: children registration
      roommate/         # Step 3: roommate search + invite
      confirm/          # Step 4: booking confirmation
  api/                  # API routes (see below)

components/
  ui/                   # Atomic UI components (PillButton, Badge, etc.)
  layout/              # Sidebar, Header, Topbar, Footer, UserDropdown
  booking/             # StepIndicator, RoomTypeCard
  forms/               # RegistrationForm (conference check-in/out)
  cards/               # ConferenceCard

lib/
  data/                # Data access layer (abstracts Strapi/Supabase)
  utils/               # Business logic (price, children, gender, search, avatar)
  validations/         # Zod schemas + tests
  supabase/            # Supabase client factories (server + browser)
  strapi.ts            # Strapi REST client
  constants/           # App-wide constants

stores/
  booking-flow.ts      # Zustand store for multi-step booking wizard

supabase/
  migrations/          # Postgres schema + RLS + Stripe sync
  templates/           # Email templates (magic link)
  config.toml          # Local Supabase config
```

---

## Environment Variables

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_STRAPI_URL` | Yes | Strapi CMS base URL |
| `STRAPI_API_TOKEN` | Yes | Strapi API Bearer token |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Optional | App base URL (falls back to request origin) |

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for local Supabase)
- Supabase CLI (`npm i -g supabase`)
- Stripe CLI (for webhook testing)

### Running Locally

```bash
# 1. Start Supabase (Postgres + Auth + Edge Functions)
supabase start

# 2. Apply migrations
supabase db reset

# 3. Start Next.js dev server
npm run dev

# 4. (Optional) Start Stripe webhook listener
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

### Full Dev Setup (with Stripe sync)

The project includes `dev_setup.sh` which starts everything in one command:
```bash
./dev_setup.sh
```
This starts Supabase, the Stripe CLI listener, and the stripe-sync-engine Docker container.

---

## API Routes

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/register-conference` | POST | Required | Register for a conference (check-in/out dates) |
| `/api/roommate-search` | GET | Required | Search registered attendees (privacy-filtered) |
| `/api/invitations` | POST | Required | Create roommate invitation (gender validated) |
| `/api/invitations` | PATCH | Required | Accept or decline an invitation |
| `/api/bookings` | POST | Required | Finalize booking (room_group + booking + children) |
| `/api/checkout` | POST | Required | Create Stripe Checkout session (room or merch) |
| `/api/payment-summary` | GET | Required | Get user's booking payment status |

---

## Authentication

Passwordless magic link flow:

1. User enters email on `/auth/login` or `/auth/register`
2. Supabase sends magic link email (10 min expiry)
3. User clicks link, redirected to `/auth/callback?code=...`
4. Callback exchanges code for session, redirects to dashboard
5. `proxy.ts` protects routes, redirects unauthenticated users

Registration is 2-step: (1) name/email/phone, (2) gender/age/church branch. Profile created via database trigger on first auth.

---

## Database Schema

### Tables (public schema)

| Table | Purpose |
|-------|---------|
| `church_branches` | 22 church locations (seeded) |
| `profiles` | User profiles (extends auth.users) |
| `conference_registrations` | Who is attending which conference |
| `room_groups` | Shared room context (type, bed, max occupants) |
| `bookings` | Individual booking within a room group |
| `invitations` | Roommate invite state machine |
| `children` | Children attached to a booking |
| `merch_orders` | Merchandise purchase records |

### Stripe schema

The `stripe` schema contains tables mirrored by stripe-sync-engine: `customers`, `checkout_sessions`, `payment_intents`, etc. A trigger on `checkout_sessions` handles payment completion (updates `bookings.amount_paid` or creates `merch_orders`).

---

## Testing

```bash
npm test              # Watch mode
npx vitest run        # Single run (CI)
```

**58 tests** across 9 test files covering:
- Validation schemas (auth, booking, children, payment)
- Business logic (price calculation, children surcharge, gender validation, search privacy)
- Constants validation

Tests are co-located with source: `price.ts` + `price.test.ts`.

---

## Conventions

### Commit Messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

feat(auth): implement magic link registration
fix(booking): correct price split when roommate joins
test(payments): add validation edge cases
chore(deps): add @dicebear/thumbs
```

Types: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `style`

### Code Style

- **TypeScript strict** - no `any`, explicit return types on exports
- **Server components by default** - `'use client'` only when needed
- **Named exports** for components, default export only for page.tsx
- **Phosphor icons** with `Icon` suffix (`UsersIcon`, not `Users`)
- **No comments** in code (code should be self-documenting)
- **Barrel exports** via `index.ts` in component folders

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `BookingCard.tsx` |
| Pages | lowercase (Next.js) | `page.tsx` |
| Utilities | kebab-case | `gender-validation.ts` |
| Tests | Same + `.test` | `gender-validation.test.ts` |

### Component Extraction Rule

JSX rendered inside `.map()` must be extracted into its own component.

---

## Design System

The full design system is documented in `docs/design.md`. Key points:

- **Colors**: oklch color space, CSS custom properties, light/dark mode
- **Typography**: Outfit (headings) + Switzer (body)
- **Radius**: `rounded-full` buttons, `rounded-2xl` cards, `rounded-xl` inputs
- **Motion**: `animate-fade-up` entrance, `hover-lift` cards, stagger grids
- **Components**: PillButton, Badge, FormField, InfoCard, SectionHeader, ImageSlider

HeroUI v3 is installed but its CSS doesn't load in Tailwind v4. Used selectively (Spinner only). All primary UI is custom.

---

## Business Rules

| Rule | Detail |
|------|--------|
| Gender sharing | Opposite genders can't share unless married or siblings |
| Room pricing | Split evenly: room_price / current_occupants |
| Children 12+ | Charged 1x per-person rate (don't consume room slot) |
| Min payment | $25 per transaction |
| Payment urgency | If check-in < 24h, payment required on booking |
| Room switching | Blocked once individual has paid in full |
| Search privacy | Name search shows phone; phone search hides phone |
| Merch | Separate payment flow, single item per transaction |

---

## Deployment

Cloudflare Pages via GitHub Actions. Environment variables set in Cloudflare dashboard.

```bash
# Build
npm run build

# The project deploys automatically on push to main
```

---

## Contributing

1. Create a feature branch: `feat/your-feature`
2. Follow conventions above (commits, code style, testing)
3. Write tests for business logic
4. Run `npm test` and `npx tsc --noEmit` before pushing
5. Open PR to `develop` branch
6. Merge to `main` triggers deployment

### Before Submitting

```bash
npm test              # All tests pass
npx tsc --noEmit     # No type errors
npm run lint          # No lint warnings
npm run build         # Build succeeds
```

---

## Key Files for Onboarding

| File | Read When |
|------|-----------|
| `CONTEXT.md` | Understanding project state and decisions |
| `docs/design.md` | Building any UI |
| `docs/plans/2026-07-15-3-day-mvp-v2.md` | Understanding the full implementation plan |
| `AGENTS.md` | AI agent coding conventions |
| `lib/constants/index.ts` | Understanding business rule thresholds |
| `stores/booking-flow.ts` | Understanding the multi-step booking wizard |
| `proxy.ts` | Understanding route protection |
