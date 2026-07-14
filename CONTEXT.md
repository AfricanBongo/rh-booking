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
Next.js 16 (Cloudflare Pages)  -->  Strapi (Coolify) : read-only content
                                -->  Supabase        : auth + transactional data
                                -->  Stripe Checkout  : payments
```

- **Next.js 16** - Frontend client on Cloudflare Pages
- **Strapi** - Headless CMS on Coolify. Admin creates conferences, room types, merch items, pickup locations. Frontend reads via REST API.
- **Supabase** - Auth (email), database (profiles, bookings, invitations, children, merch orders), Edge Functions (Stripe webhooks)
- **Stripe** - Checkout (hosted payment page) for room payments and merch. stripe-sync-engine mirrors payment data to Supabase.
- **Data access layer** - `lib/data/` abstracts the source. Components never know if data comes from Strapi or Supabase.

## Tech Stack

- Next.js 16, React 19, Tailwind CSS 4, HeroUI
- Supabase (Auth + Postgres + Edge Functions + stripe-sync-engine)
- Strapi v5 (headless CMS, self-hosted on Coolify)
- Stripe Checkout
- Cloudflare Pages (deployment)

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

- [ ] Infrastructure setup
- [ ] Auth working
- [ ] Marketing site + Conference pages
- [ ] Room booking
- [ ] Children registration
- [ ] Roommate flow
- [ ] Invitations accept/decline
- [ ] Payments (Stripe)
- [ ] Merch store
- [ ] Dashboard
- [ ] Navigation + polish
- [ ] Deployed

## What's Done

(Nothing yet - project kickoff)

## What's Next

Session 1: Infrastructure + Auth + Marketing (Sonnet + Opus for auth)

## Environment

- Strapi: TBD (Coolify)
- Supabase: TBD
- Stripe: TBD
- Local dev: http://localhost:3000
- Deployed: TBD (Cloudflare Pages)

## File Structure (planned)

```
app/
  page.tsx                          # Marketing landing
  conferences/
    [id]/page.tsx                   # Conference detail + register
  auth/
    register/page.tsx
    login/page.tsx
    callback/route.ts
  dashboard/
    page.tsx                        # User dashboard
    profile/page.tsx
  book/
    [conferenceId]/
      page.tsx                      # Room selection
      children/page.tsx
      roommate/page.tsx
      confirm/page.tsx
  pay/page.tsx                      # Payment page
  invitations/page.tsx
  merch/
    page.tsx                        # Merch listing
    [id]/page.tsx                   # Merch detail
    orders/page.tsx
  api/
    checkout/route.ts               # Stripe Checkout session

lib/
  data/
    conferences.ts                  # Reads from Strapi
    rooms.ts                        # Reads from Strapi + Supabase
    merch.ts                        # Reads from Strapi
    bookings.ts                     # Reads/writes Supabase
    payments.ts                     # Reads from Supabase (synced Stripe data)
    profiles.ts                     # Reads/writes Supabase
    invitations.ts                  # Reads/writes Supabase
  supabase/
    client.ts                       # Browser client
    server.ts                       # Server client
    middleware.ts                   # Auth middleware helper
  strapi.ts                         # Strapi REST client
  heroui-theme.ts                   # Custom theme
  constants/
    church-branches.ts

components/
  header.tsx
  mobile-nav.tsx

supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
  functions/
    stripe-webhook/index.ts

middleware.ts                        # Route protection
CONTEXT.md                          # This file
```

## Active Gotchas

(None yet)
