# supabase/ - Database & Edge Functions

Local Supabase configuration, migrations, and serverless functions.

## Migrations

Applied in order via `supabase db reset` or `supabase migration up`:

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Core tables (profiles, bookings, room_groups, invitations, children, merch_orders, church_branches), triggers, grants |
| `002_rls_policies.sql` | Row Level Security on all tables (user sees own data, search sees limited profiles) |
| `003_stripe_schema.sql` | stripe-sync-engine tables (customers, checkout_sessions, payment_intents, etc.) |
| `004_stripe_integration.sql` | `stripe_customer_id` on profiles, `handle_stripe_checkout_completed()` trigger |

## Key Trigger: `handle_stripe_checkout_completed()`

Fires on `stripe.checkout_sessions` INSERT/UPDATE when `payment_status = 'paid'`:

- **Room payment** (`metadata.type = "room_payment"`): increments `bookings.amount_paid` by `session.amount_total`
- **Merch purchase** (`metadata.type = "merch"`): creates `merch_orders` row with status "paid"

Idempotent (checks for existing stripe_payment_id before inserting).

## Commands

```bash
supabase start          # Start local Supabase (Docker)
supabase stop           # Stop local Supabase
supabase db reset       # Drop + recreate with all migrations + seed
supabase migration new  # Create a new migration file
supabase db diff        # Generate migration from schema changes
```

## Local URLs (after `supabase start`)

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:54321 |
| Studio | http://127.0.0.1:54323 |
| Inbucket (email) | http://127.0.0.1:54324 |
