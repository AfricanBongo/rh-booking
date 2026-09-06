# Admin Panel - Design

**Date:** 2026-09-04
**Status:** Approved, ready for implementation planning

## Goal

A minimal read-only admin panel inside the existing Next.js app, with exactly one write action (mark a cash invoice as paid). Admins need to see signups, per-branch membership, member details, conference attendance, and money collected versus outstanding.

## Scope Decision: Same App, Not a New Project

The repo is already effectively a monorepo: Next.js at root, `strapi/`, `supabase/`. The admin panel is a new route group in the same app.

Nothing existing is reworked. The admin panel reuses the same HeroUI v3 components, the same `docs/design.md` tokens, the same Supabase clients, the same deployment pipeline.

**Migrations: 2. New files: ~14. Existing files touched: 3.**

Rejected alternatives:

| Option | Why not |
|--------|---------|
| Separate Next.js app in a workspace | Duplicates the design system, the Supabase client setup, the auth flow, and the deploy config. Buys isolation nobody asked for. |
| Strapi admin panel extension | Strapi has no access to Supabase transactional data. Wrong database. |
| Retool / Supabase Studio | Loses the design system, adds a vendor, and cannot call the Stripe API to mark invoices paid out of band. |

## Authorization

There is currently no admin concept anywhere in the codebase. No role, no flag, no table, no JWT claim. This is built from zero.

### Mechanism

`profiles.is_admin BOOLEAN NOT NULL DEFAULT false`, combined with Supabase native TOTP MFA.

One SQL helper is the single source of truth:

```sql
create function public.is_admin_aal2() returns boolean
  language sql stable security definer set search_path = public as $$
  select (select auth.jwt() ->> 'aal') = 'aal2'
     and exists (select 1 from profiles where id = auth.uid() and is_admin);
$$;
```

### Why TOTP MFA is the right tradeoff

Admins read every member's personal details, so a leaked magic link should not be enough. Supabase TOTP is the cheapest way to get a real second factor:

- Free on all Supabase tiers. Phone/SMS MFA is a $75/month add-on and is not needed.
- Works with the existing magic link. Magic link produces `aal1`; TOTP verification upgrades the session to `aal2`.
- `aal` is a standard claim in the Supabase JWT. `middleware.ts` already calls `getClaims()` on every protected route, so the check costs zero extra network calls.
- `mfa.enroll({ factorType: 'totp' })` returns the QR code as an SVG string. No QR library needed.
- MFA is enforced on `/admin/*` only. Members never encounter it.

Sources: https://supabase.com/docs/guides/auth/auth-mfa and https://supabase.com/docs/guides/auth/auth-mfa/totp

### Three layers of enforcement

1. **Middleware.** `/admin/*` requires `is_admin` and `aal2`. The existing profile lookup adds one column to its `select`. Failure returns 404, not 403, so the surface is not advertised.
2. **RLS.** Restrictive policies gated on `is_admin_aal2()`. If a route handler forgets its check, Postgres still refuses.
3. **Route handlers.** `/api/*` is excluded from the middleware matcher, so every `/api/admin/*` handler re-checks server side.

### Why RLS and not a service-role client

A service-role client bypasses RLS entirely, so a single forgotten authorization check leaks the whole database. Admin RLS policies are both safer and less code: no new client file, no service-role grants migration, and the existing `createClient()` from `lib/supabase/server.ts` is reused unchanged.

### MFA recovery

Manual. Another admin deletes the `auth.mfa_factors` row in the Supabase dashboard and the locked-out admin re-enrolls. Correct at a scale of two or three admins. Recovery codes were considered and rejected as disproportionate work.

## Routes

```
app/(admin)/layout.tsx                        Sidebar + Topbar with admin nav
app/(admin)/admin/page.tsx                    Overview
app/(admin)/admin/members/page.tsx            Search + list
app/(admin)/admin/members/[id]/page.tsx       Member detail
app/(admin)/admin/conferences/[id]/page.tsx   Attendees | Rooming list
app/(admin)/admin/payments/page.tsx           Outstanding | Cash invoices | Reconciliation
```

Five pages. Tabs are used instead of extra routes where the data shares a page's context.

| Page | Contents |
|------|----------|
| `/admin` | Total signups, per-branch member counts (sortable, CSV), one card per conference showing registered / booked / collected / outstanding, audit feed at the bottom |
| `/admin/members` | Single search box across name, phone, and email |
| `/admin/members/[id]` | Profile, bookings, roommates, children, dining passes, merch orders, payment history |
| `/admin/conferences/[id]` | Tab: attendee list. Tab: rooming list grouped by room with bed preference, children, dining passes. CSV on both. |
| `/admin/payments` | Tab: outstanding balances sorted by amount owed with days until deadline. Tab: open cash invoices with Mark Paid. Tab: reconciliation. |

The audit log sits at the bottom of the overview rather than getting its own nav item, so it is seen rather than sought out.

`components/layout/Sidebar.tsx` currently hardcodes `NAV_ITEMS`. It becomes an optional prop defaulting to the current array. One line, no duplication, and the admin panel inherits the exact shell and design system.

## Reading Stripe Data

The `stripe` schema is not exposed via PostgREST (`supabase/config.toml` lists only `public` and `graphql_public`) and has RLS disabled on every table. Exposing the schema would be the wrong move.

Instead, three `SECURITY DEFINER` functions in `public`, each raising unless `is_admin_aal2()`:

| Function | Purpose |
|----------|---------|
| `admin_list_members()` | Joins `profiles`, `auth.users.email`, and `church_branches.name`. Needed because `profiles` has no email column. |
| `admin_open_invoices()` | Open cash invoices from the mirror, with member and booking context. |
| `admin_reconciliation()` | `bookings.amount_paid` compared against summed paid `stripe.invoices` and `stripe.checkout_sessions` for that `booking_id`. Returns rows where the delta is non-zero. |

### Why reconciliation matters

Both `handle_stripe_invoice_paid()` and `handle_stripe_checkout_completed()` end in `EXCEPTION WHEN OTHERS THEN RAISE WARNING ... RETURN NEW`. A failed credit is currently invisible to the member, the admin, and the app. Money can be collected by Stripe while `bookings.amount_paid` never moves, and nothing surfaces it. This view is the only thing that would catch it.

## The One Write Action

`POST /api/admin/invoices/[id]/pay` calls `stripe.invoices.pay(id, { paid_out_of_band: true })` via the Stripe SDK, then writes an audit row.

The existing pipeline does the rest: Stripe fires a webhook, stripe-sync-engine mirrors the status change into `stripe.invoices`, and the existing `handle_stripe_invoice_paid()` trigger credits `bookings.amount_paid`. All of that machinery already exists and works today. The admin button simply replaces opening the Stripe dashboard from the notification email.

**Do not write `stripe.invoices.status` directly.** The mirror is upserted from Stripe on every webhook, so a local status change is reverted on the next sync and leaves Stripe's books disagreeing with the app's. For the same reason, `void_open_invoices_for_booking()` must not be reused for any admin void action; it only mutates the local mirror.

## Email Notification

`supabase/functions/notify-cash-payment/index.ts` keeps firing when a member requests a cash invoice, with two changes:

- Recipients come from `profiles where is_admin = true`, joined to `auth.users` for addresses, instead of the single `FINANCE_ADMIN_EMAIL` environment variable. Removes env drift and supports multiple admins.
- The link becomes `${APP_URL}/admin/payments?tab=invoices&invoice=<id>` instead of `https://dashboard.stripe.com/invoices/<id>`, deep-linking to the row with the Mark Paid button.

## Supporting Details

**Strapi name resolution.** `conference_id`, `room_type_id`, `merch_item_id`, and `dining_pass_id` are Strapi `documentId` strings in Postgres, not names. Each admin page batch-fetches the relevant Strapi collections once into a `Map` and looks up from there. `app/(app)/pay/page.tsx` currently does this per row in a loop; that N+1 pattern is not repeated.

**CSV export.** `GET /api/admin/export/[dataset]` returns `text/csv`. Roughly fifteen lines of escaping and joining. No dependency.

**Audit log.** `admin_actions(id, admin_id, action, target_type, target_id, metadata jsonb, created_at)`. Written on mark-paid, read on the overview.

## Testing

Per `AGENTS.md`, business logic requires tests:

- `is_admin_aal2()` gating: non-admin, admin at `aal1`, admin at `aal2`
- Reconciliation delta calculation
- CSV escaping (commas, quotes, newlines in member names)
- Admin API route rejection for unauthenticated, non-admin, and `aal1` callers

## Accepted Risks

### room_groups RLS is fully open

Migration `20260827164741_room_groups_rls_fix.sql` replaced the original policies with:

```sql
create policy "..." on room_groups for all to authenticated using (true) with check (true);
```

Any authenticated member can read, modify, or delete any room group.

**Blast radius:** `bookings.room_group_id` is `ON DELETE CASCADE`, and `children` and `booking_dining_passes` cascade off `bookings`. A single `DELETE` from any member's browser session destroys every booking in that room group, including fully paid ones, along with the associated children and dining pass records. Stripe retains the payment records; the bookings those payments credited do not survive.

**Decision:** Accepted for now, not fixed as part of this work. Documented here so the decision is on record with the correct blast radius. The migration that introduced it was itself labelled a fix, so something in the booking flow depended on the loose policy; any future fix should trace that dependency first.

### Trigger exceptions are swallowed

Both Stripe triggers swallow all exceptions. Not fixed here. The reconciliation view is the mitigation: it makes silent failures visible rather than preventing them.

## Out of Scope

Cancelling bookings, refunds, editing member or booking records, and global command-K search. Every write beyond mark-paid would need to re-implement the validation the member-facing flow already enforces (gender rules, occupancy limits, price splitting) or risk bypassing it.
