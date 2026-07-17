-- Create stripe schema (required before sync-engine tables)
CREATE SCHEMA IF NOT EXISTS stripe;

-- =============================================================================
-- Stripe Sync Engine - All Migrations (0000-0042)
-- Source: https://github.com/stripe/sync-engine/tree/main/packages/sync-engine/src/database/migrations
-- =============================================================================

-- 0000_initial_migration.sql
select 1;

-- 0001_products.sql
create table if not exists "stripe"."products" (
  "id" text primary key,
  "object" text,
  "active" boolean,
  "description" text,
  "metadata" jsonb,
  "name" text,
  "created" integer,
  "images" jsonb,
  "livemode" boolean,
  "package_dimensions" jsonb,
  "shippable" boolean,
  "statement_descriptor" text,
  "unit_label" text,
  "updated" integer,
  "url" text
);

-- 0002_customers.sql
create table if not exists "stripe"."customers" (
  "id" text primary key,
  "object" text,
  "address" jsonb,
  "description" text,
  "email" text,
  "metadata" jsonb,
  "name" text,
  "phone" text,
  "shipping" jsonb,
  "balance" integer,
  "created" integer,
  "currency" text,
  "default_source" text,
  "delinquent" boolean,
  "discount" jsonb,
  "invoice_prefix" text,
  "invoice_settings" jsonb,
  "livemode" boolean,
  "next_invoice_sequence" integer,
  "preferred_locales" jsonb,
  "tax_exempt" text
);

-- 0003_prices.sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type') THEN
        create type "stripe"."pricing_type" as enum ('one_time', 'recurring');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tiers') THEN
      create type "stripe"."pricing_tiers" as enum ('graduated', 'volume');
    END IF;
    --more types here...
END
$$;


create table if not exists "stripe"."prices" (
  "id" text primary key,
  "object" text,
  "active" boolean,
  "currency" text,
  "metadata" jsonb,
  "nickname" text,
  "recurring" jsonb,
  "type" stripe.pricing_type,
  "unit_amount" integer,
  "billing_scheme" text,
  "created" integer,
  "livemode" boolean,
  "lookup_key" text,
  "tiers_mode" stripe.pricing_tiers,
  "transform_quantity" jsonb,
  "unit_amount_decimal" text,

  "product" text references stripe.products
);

-- 0004_subscriptions.sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        create type "stripe"."subscription_status" as enum (
          'trialing',
          'active',
          'canceled',
          'incomplete',
          'incomplete_expired',
          'past_due',
          'unpaid'
        );
    END IF;
END
$$;

create table if not exists "stripe"."subscriptions" (
  "id" text primary key,
  "object" text,
  "cancel_at_period_end" boolean,
  "current_period_end" integer,
  "current_period_start" integer,
  "default_payment_method" text,
  "items" jsonb,
  "metadata" jsonb,
  "pending_setup_intent" text,
  "pending_update" jsonb,
  "status" "stripe"."subscription_status", 
  "application_fee_percent" double precision,
  "billing_cycle_anchor" integer,
  "billing_thresholds" jsonb,
  "cancel_at" integer,
  "canceled_at" integer,
  "collection_method" text,
  "created" integer,
  "days_until_due" integer,
  "default_source" text,
  "default_tax_rates" jsonb,
  "discount" jsonb,
  "ended_at" integer,
  "livemode" boolean,
  "next_pending_invoice_item_invoice" integer,
  "pause_collection" jsonb,
  "pending_invoice_item_interval" jsonb,
  "start_date" integer,
  "transfer_data" jsonb,
  "trial_end" jsonb,
  "trial_start" jsonb,

  "schedule" text,
  "customer" text references "stripe"."customers",
  "latest_invoice" text, -- not yet joined
  "plan" text -- not yet joined
);

-- 0005_invoices.sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        create type "stripe"."invoice_status" as enum ('draft', 'open', 'paid', 'uncollectible', 'void');
    END IF;
END
$$;


create table if not exists "stripe"."invoices" (
  "id" text primary key,
  "object" text,
  "auto_advance" boolean,
  "collection_method" text,
  "currency" text,
  "description" text,
  "hosted_invoice_url" text,
  "lines" jsonb,
  "metadata" jsonb,
  "period_end" integer,
  "period_start" integer,
  "status" "stripe"."invoice_status",
  "total" bigint,
  "account_country" text,
  "account_name" text,
  "account_tax_ids" jsonb,
  "amount_due" bigint,
  "amount_paid" bigint,
  "amount_remaining" bigint,
  "application_fee_amount" bigint,
  "attempt_count" integer,
  "attempted" boolean,
  "billing_reason" text,
  "created" integer,
  "custom_fields" jsonb,
  "customer_address" jsonb,
  "customer_email" text,
  "customer_name" text,
  "customer_phone" text,
  "customer_shipping" jsonb,
  "customer_tax_exempt" text,
  "customer_tax_ids" jsonb,
  "default_tax_rates" jsonb,
  "discount" jsonb,
  "discounts" jsonb,
  "due_date" integer,
  "ending_balance" integer,
  "footer" text,
  "invoice_pdf" text,
  "last_finalization_error" jsonb,
  "livemode" boolean,
  "next_payment_attempt" integer,
  "number" text,
  "paid" boolean,
  "payment_settings" jsonb,
  "post_payment_credit_notes_amount" integer,
  "pre_payment_credit_notes_amount" integer,
  "receipt_number" text,
  "starting_balance" integer,
  "statement_descriptor" text,
  "status_transitions" jsonb,
  "subtotal" integer,
  "tax" integer,
  "total_discount_amounts" jsonb,
  "total_tax_amounts" jsonb,
  "transfer_data" jsonb,
  "webhooks_delivered_at" integer,

  "customer" text references "stripe"."customers",
  "subscription" text references "stripe"."subscriptions",
  "payment_intent" text,  -- not yet implemented
  "default_payment_method" text, -- not yet implemented
  "default_source" text, -- not yet implemented
  "on_behalf_of" text, -- not yet implemented
  "charge" text -- not yet implemented
);

-- 0006_charges.sql
create table if not exists "stripe".charges (
    id text primary key,
    object text,
    card jsonb,
    paid boolean,
    "order" text,
    amount bigint,
    review text,
    source jsonb,
    status text,
    created integer,
    dispute text,
    invoice text,
    outcome jsonb,
    refunds jsonb,
    updated integer,
    captured boolean,
    currency text,
    customer text,
    livemode boolean,
    metadata jsonb,
    refunded boolean,
    shipping jsonb,
    application text,
    description text,
    destination text,
    failure_code text,
    on_behalf_of text,
    fraud_details jsonb,
    receipt_email text,
    payment_intent text,
    receipt_number text,
    transfer_group text,
    amount_refunded bigint,
    application_fee text,
    failure_message text,
    source_transfer text,
    balance_transaction text,
    statement_descriptor text,
    statement_description text,
    payment_method_details jsonb
);

-- 0007_coupons.sql
create table if not exists "stripe".coupons (
    id text primary key,
    object text,
    name text,
    valid boolean,
    created integer,
    updated integer,
    currency text,
    duration text,
    livemode boolean,
    metadata jsonb,
    redeem_by integer,
    amount_off bigint,
    percent_off double precision,
    times_redeemed bigint,
    max_redemptions bigint,
    duration_in_months bigint,
    percent_off_precise double precision
);

-- 0008_disputes.sql
create table if not exists "stripe".disputes (
    id text primary key,
    object text,
    amount bigint,
    charge text,
    reason text,
    status text,
    created integer,
    updated integer,
    currency text,
    evidence jsonb,
    livemode boolean,
    metadata jsonb,
    evidence_details jsonb,
    balance_transactions jsonb,
    is_charge_refundable boolean
);

-- 0009_events.sql
create table if not exists "stripe".events (
    id text primary key,
    object text,
    data jsonb,
    type text,
    created integer,
    request text,
    updated integer,
    livemode boolean,
    api_version text,
    pending_webhooks bigint
);

-- 0010_payouts.sql
create table if not exists "stripe".payouts (
    id text primary key,
    object text,
    date text,
    type text,
    amount bigint,
    method text,
    status text,
    created integer,
    updated integer,
    currency text,
    livemode boolean,
    metadata jsonb,
    automatic boolean,
    recipient text,
    description text,
    destination text,
    source_type text,
    arrival_date text,
    bank_account jsonb,
    failure_code text,
    transfer_group text,
    amount_reversed bigint,
    failure_message text,
    source_transaction text,
    balance_transaction text,
    statement_descriptor text,
    statement_description text,
    failure_balance_transaction text
);

-- 0011_plans.sql
create table if not exists "stripe"."plans" (
    id text primary key,
    object text,
    name text,
    tiers jsonb,
    active boolean,
    amount bigint,
    created integer,
    product text,
    updated integer,
    currency text,
    "interval" text,
    livemode boolean,
    metadata jsonb,
    nickname text,
    tiers_mode text,
    usage_type text,
    billing_scheme text,
    interval_count bigint,
    aggregate_usage text,
    transform_usage text,
    trial_period_days bigint,
    statement_descriptor text,
    statement_description text
);

-- 0012_add_updated_at.sql
create or replace function set_updated_at() returns trigger
    language plpgsql
as
$$
begin
  new.updated_at = now();
  return NEW;
end;
$$;

alter function set_updated_at() owner to postgres;

alter table stripe.subscriptions
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.subscriptions
    for each row
    execute procedure set_updated_at();

alter table stripe.products
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.products
    for each row
    execute procedure set_updated_at();

alter table stripe.customers
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.customers
    for each row
    execute procedure set_updated_at();

alter table stripe.prices
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.prices
    for each row
    execute procedure set_updated_at();

alter table stripe.invoices
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.invoices
    for each row
    execute procedure set_updated_at();

alter table stripe.charges
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.charges
    for each row
    execute procedure set_updated_at();

alter table stripe.coupons
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.coupons
    for each row
    execute procedure set_updated_at();

alter table stripe.disputes
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.disputes
    for each row
    execute procedure set_updated_at();

alter table stripe.events
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.events
    for each row
    execute procedure set_updated_at();

alter table stripe.payouts
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.payouts
    for each row
    execute procedure set_updated_at();

alter table stripe.plans
    add updated_at timestamptz default timezone('utc'::text, now()) not null;

create trigger handle_updated_at
    before update
    on stripe.plans
    for each row
    execute procedure set_updated_at();

-- 0013_add_subscription_items.sql
create table if not exists "stripe"."subscription_items" (
  "id" text primary key,
  "object" text,
  "billing_thresholds" jsonb,
  "created" integer,
  "deleted" boolean,
  "metadata" jsonb,
  "quantity" integer,
  "price" text references "stripe"."prices",
  "subscription" text references "stripe"."subscriptions",
  "tax_rates" jsonb
);

-- 0014_migrate_subscription_items.sql
WITH subscriptions AS (
  select jsonb_array_elements(items->'data') as obj from "stripe"."subscriptions"
)
insert into "stripe"."subscription_items"
select obj->>'id' as "id",
  obj->>'object' as "object", 
  obj->'billing_thresholds' as "billing_thresholds", 
  (obj->>'created')::INTEGER as "created", 
  (obj->>'deleted')::BOOLEAN as "deleted", 
  obj->'metadata' as "metadata", 
  (obj->>'quantity')::INTEGER as "quantity", 
  (obj->'price'->>'id')::TEXT as "price", 
  obj->>'subscription' as "subscription", 
  obj->'tax_rates' as "tax_rates"
from subscriptions
on conflict ("id") 
do update set "id" = excluded."id",
  "object" = excluded."object",
  "billing_thresholds" = excluded."billing_thresholds",
  "created" = excluded."created",
  "deleted" = excluded."deleted",
  "metadata" = excluded."metadata",
  "quantity" = excluded."quantity",
  "price" = excluded."price",
  "subscription" = excluded."subscription",
  "tax_rates" = excluded."tax_rates";

-- 0015_add_customer_deleted.sql
alter table stripe.customers
    add deleted boolean default false not null;

-- 0016_add_invoice_indexes.sql
CREATE INDEX stripe_invoices_customer_idx ON "stripe"."invoices" USING btree (customer);
CREATE INDEX stripe_invoices_subscription_idx ON "stripe"."invoices" USING btree (subscription);

-- 0017_drop_charges_unavailable_columns.sql
-- drop columns that are duplicated / not available anymore
-- card is not available on webhook v.2020-03-02. We can get the detail from payment_method_details
-- statement_description is not available on webhook v.2020-03-02
alter table "stripe"."charges"
    drop column if exists "card",
    drop column if exists "statement_description";

-- 0018_setup_intents.sql
create table if not exists "stripe"."setup_intents" (
    id text primary key,
    object text,
    created integer,
    customer text,
    description text,
    payment_method text,
    status text,
    usage text,
    cancellation_reason text,
    latest_attempt text,
    mandate text,
    single_use_mandate text,
    on_behalf_of text
);

CREATE INDEX stripe_setup_intents_customer_idx ON "stripe"."setup_intents" USING btree (customer);

-- 0019_payment_methods.sql
create table if not exists "stripe"."payment_methods" (
    id text primary key,
    object text,
    created integer,
    customer text,
    type text,
    billing_details jsonb,
    metadata jsonb,
    card jsonb
);

CREATE INDEX stripe_payment_methods_customer_idx ON "stripe"."payment_methods" USING btree (customer);

-- 0020_disputes_payment_intent_created_idx.sql
ALTER TABLE "stripe"."disputes" ADD COLUMN IF NOT EXISTS payment_intent TEXT;

CREATE INDEX IF NOT EXISTS stripe_dispute_created_idx ON "stripe"."disputes" USING btree (created);

-- 0021_payment_intent.sql
create table if not exists "stripe"."payment_intents" (
  id text primary key,
  object text,
  amount integer,
  amount_capturable integer,
  amount_details jsonb,
  amount_received integer,
  application text,
  application_fee_amount integer,
  automatic_payment_methods text,
  canceled_at integer,
  cancellation_reason text,
  capture_method text,
  client_secret text,
  confirmation_method text,
  created integer,
  currency text,
  customer text,
  description text,
  invoice text,
  last_payment_error text,
  livemode boolean,
  metadata jsonb,
  next_action text,
  on_behalf_of text,
  payment_method text,
  payment_method_options jsonb,
  payment_method_types jsonb,
  processing text,
  receipt_email text,
  review text,
  setup_future_usage text,
  shipping jsonb,
  statement_descriptor text,
  statement_descriptor_suffix text,
  status text,
  transfer_data jsonb,
  transfer_group text
);

CREATE INDEX stripe_payment_intents_customer_idx ON "stripe"."payment_intents" USING btree (customer);
CREATE INDEX stripe_payment_intents_invoice_idx ON "stripe"."payment_intents" USING btree (invoice);

-- 0022_adjust_plans.sql
ALTER TABLE if exists "stripe"."plans" DROP COLUMN name;
ALTER TABLE if exists "stripe"."plans" DROP COLUMN updated;
ALTER TABLE if exists "stripe"."plans" DROP COLUMN tiers;
ALTER TABLE if exists "stripe"."plans" DROP COLUMN statement_descriptor;
ALTER TABLE if exists "stripe"."plans" DROP COLUMN statement_description;

-- 0023_invoice_deleted.sql
ALTER TYPE "stripe"."invoice_status" ADD VALUE 'deleted';

-- 0024_subscription_schedules.sql
do $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_schedule_status') THEN
        create type "stripe"."subscription_schedule_status" as enum ('not_started', 'active', 'completed', 'released', 'canceled');
    END IF;
END
$$;

create table if not exists
    "stripe"."subscription_schedules" (
        id text primary key,
        object text,
        application text,
        canceled_at integer,
        completed_at integer,
        created integer not null,
        current_phase jsonb,
        customer text not null,
        default_settings jsonb,
        end_behavior text,
        livemode boolean not null,
        metadata jsonb not null,
        phases jsonb not null,
        released_at integer,
        released_subscription text,
        status stripe.subscription_schedule_status not null,
        subscription text,
        test_clock text
    );

-- 0025_tax_ids.sql
create table if not exists
  "stripe"."tax_ids" (
    "id" text primary key,
    "object" text,
    "country" text,
    "customer" text,
    "type" text,
    "value" text,
    "created" integer not null,
    "livemode" boolean,
    "owner" jsonb
  );

create index stripe_tax_ids_customer_idx on "stripe"."tax_ids" using btree (customer);

-- 0026_credit_notes.sql
create table if not exists
  "stripe"."credit_notes" (
    "id" text primary key,
    object text,
    amount integer,
    amount_shipping integer,
    created integer,
    currency text,
    customer text,
    customer_balance_transaction text,
    discount_amount integer,
    discount_amounts jsonb,
    invoice text,
    lines jsonb,
    livemode boolean,
    memo text,
    metadata jsonb,
    number text,
    out_of_band_amount integer,
    pdf text,
    reason text,
    refund text,
    shipping_cost jsonb,
    status text,
    subtotal integer,
    subtotal_excluding_tax integer,
    tax_amounts jsonb,
    total integer,
    total_excluding_tax integer,
    type text,
    voided_at text
  );

create index stripe_credit_notes_customer_idx on "stripe"."credit_notes" using btree (customer);

create index stripe_credit_notes_invoice_idx on "stripe"."credit_notes" using btree (invoice);

-- 0027_add_marketing_features_to_products.sql
ALTER TABLE IF EXISTS stripe.products ADD COLUMN IF NOT EXISTS marketing_features JSONB;

-- 0028_early_fraud_warning.sql
create table
    if not exists "stripe"."early_fraud_warnings" (
        "id" text primary key,
        object text,
        actionable boolean,
        charge text,
        created integer,
        fraud_type text,
        livemode boolean,
        payment_intent text,
        updated_at timestamptz default timezone('utc'::text, now()) not null
    );

create index stripe_early_fraud_warnings_charge_idx on "stripe"."early_fraud_warnings" using btree (charge);

create index stripe_early_fraud_warnings_payment_intent_idx on "stripe"."early_fraud_warnings" using btree (payment_intent);

create trigger handle_updated_at
    before update
    on stripe.early_fraud_warnings
    for each row
    execute procedure set_updated_at();

-- 0029_reviews.sql
create table
    if not exists "stripe"."reviews" (
        "id" text primary key,
        object text,
        billing_zip text,
        charge text,
        created integer,
        closed_reason text,
        livemode boolean,
        ip_address text,
        ip_address_location jsonb,
        open boolean,
        opened_reason text,
        payment_intent text,
        reason text,
        session text,
        updated_at timestamptz default timezone('utc'::text, now()) not null
    );

create index stripe_reviews_charge_idx on "stripe"."reviews" using btree (charge);

create index stripe_reviews_payment_intent_idx on "stripe"."reviews" using btree (payment_intent);

create trigger handle_updated_at
    before update
    on stripe.reviews
    for each row
    execute procedure set_updated_at();

-- 0030_refunds.sql
create table
    if not exists "stripe"."refunds" (
        "id" text primary key,
        object text,
        amount integer,
        balance_transaction text,
        charge text,
        created integer,
        currency text,
        destination_details jsonb,
        metadata jsonb,
        payment_intent text,
        reason text,
        receipt_number text,
        source_transfer_reversal text,
        status text,
        transfer_reversal text,
        updated_at timestamptz default timezone('utc'::text, now()) not null
    );

create index stripe_refunds_charge_idx on "stripe"."refunds" using btree (charge);

create index stripe_refunds_payment_intent_idx on "stripe"."refunds" using btree (payment_intent);

create trigger handle_updated_at
    before update
    on stripe.refunds
    for each row
    execute procedure set_updated_at();

-- 0031_add_default_price.sql
alter table "stripe"."products"
add column IF NOT EXISTS "default_price" text;

-- 0032_update_subscription_items.sql
ALTER TABLE "stripe"."subscription_items"
ADD COLUMN IF NOT EXISTS "current_period_end" integer,
ADD COLUMN IF NOT EXISTS "current_period_start" integer;

-- 0033_add_last_synced_at.sql
-- Add last_synced_at column to all Stripe tables for tracking sync status

-- Charges
alter table "stripe"."charges"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Coupons
alter table "stripe"."coupons"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Credit Notes
alter table "stripe"."credit_notes"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Customers
alter table "stripe"."customers"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Disputes
alter table "stripe"."disputes"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Early Fraud Warnings
alter table "stripe"."early_fraud_warnings"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Events
alter table "stripe"."events"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Invoices
alter table "stripe"."invoices"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Payment Intents
alter table "stripe"."payment_intents"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Payment Methods
alter table "stripe"."payment_methods"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Payouts
alter table "stripe"."payouts"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Plans
alter table "stripe"."plans"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Prices
alter table "stripe"."prices"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Products
alter table "stripe"."products"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Refunds
alter table "stripe"."refunds"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Reviews
alter table "stripe"."reviews"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Setup Intents
alter table "stripe"."setup_intents"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Subscription Items
alter table "stripe"."subscription_items"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Subscription Schedules
alter table "stripe"."subscription_schedules"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Subscriptions
alter table "stripe"."subscriptions"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- Tax IDs
alter table "stripe"."tax_ids"
add column IF NOT EXISTS "last_synced_at" timestamptz;

-- 0034_remove_foreign_keys.sql
-- Remove all foreign key constraints

ALTER TABLE "stripe"."subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_customer_fkey";

ALTER TABLE "stripe"."prices" DROP CONSTRAINT IF EXISTS "prices_product_fkey";

ALTER TABLE "stripe"."invoices" DROP CONSTRAINT IF EXISTS "invoices_customer_fkey";

ALTER TABLE "stripe"."invoices" DROP CONSTRAINT IF EXISTS "invoices_subscription_fkey";

ALTER TABLE "stripe"."subscription_items" DROP CONSTRAINT IF EXISTS "subscription_items_price_fkey";

ALTER TABLE "stripe"."subscription_items" DROP CONSTRAINT IF EXISTS "subscription_items_subscription_fkey";

-- 0035_checkout_sessions.sql
create table
    if not exists "stripe"."checkout_sessions" (
        "id" text primary key,
        "object" text,
        "adaptive_pricing" jsonb,
        "after_expiration" jsonb,
        "allow_promotion_codes" boolean,
        "amount_subtotal" integer,
        "amount_total" integer,
        "automatic_tax" jsonb,
        "billing_address_collection" text,
        "cancel_url" text,
        "client_reference_id" text,
        "client_secret" text,
        "collected_information" jsonb,
        "consent" jsonb,
        "consent_collection" jsonb,
        "created" integer,
        "currency" text,
        "currency_conversion" jsonb,
        "custom_fields" jsonb,
        "custom_text" jsonb,
        "customer" text,
        "customer_creation" text,
        "customer_details" jsonb,
        "customer_email" text,
        "discounts" jsonb,
        "expires_at" integer,
        "invoice" text,
        "invoice_creation" jsonb,
        "livemode" boolean,
        "locale" text,
        "metadata" jsonb,
        "mode" text,
        "optional_items" jsonb,
        "payment_intent" text,
        "payment_link" text,
        "payment_method_collection" text,
        "payment_method_configuration_details" jsonb,
        "payment_method_options" jsonb,
        "payment_method_types" jsonb,
        "payment_status" text,
        "permissions" jsonb,
        "phone_number_collection" jsonb,
        "presentment_details" jsonb,
        "recovered_from" text,
        "redirect_on_completion" text,
        "return_url" text,
        "saved_payment_method_options" jsonb,
        "setup_intent" text,
        "shipping_address_collection" jsonb,
        "shipping_cost" jsonb,
        "shipping_details" jsonb,
        "shipping_options" jsonb,
        "status" text,
        "submit_type" text,
        "subscription" text,
        "success_url" text,
        "tax_id_collection" jsonb,
        "total_details" jsonb,
        "ui_mode" text,
        "url" text,
        "wallet_options" jsonb,
        "updated_at" timestamptz default timezone('utc'::text, now()) not null,
        "last_synced_at" timestamptz
    );

create index stripe_checkout_sessions_customer_idx on "stripe"."checkout_sessions" using btree (customer);
create index stripe_checkout_sessions_subscription_idx on "stripe"."checkout_sessions" using btree (subscription);
create index stripe_checkout_sessions_payment_intent_idx on "stripe"."checkout_sessions" using btree (payment_intent);
create index stripe_checkout_sessions_invoice_idx on "stripe"."checkout_sessions" using btree (invoice);

create trigger handle_updated_at
    before update
    on stripe.checkout_sessions
    for each row
    execute procedure set_updated_at();

-- 0036_checkout_session_line_items.sql
create table if not exists "stripe"."checkout_session_line_items" (
  "id" text primary key,
  "object" text,
  "amount_discount" integer,
  "amount_subtotal" integer,
  "amount_tax" integer,
  "amount_total" integer,
  "currency" text,
  "description" text,
  "price" text references "stripe"."prices" on delete cascade,
  "quantity" integer,
  "checkout_session" text references "stripe"."checkout_sessions" on delete cascade,
  "updated_at" timestamptz default timezone('utc'::text, now()) not null,
  "last_synced_at" timestamptz
);

create index stripe_checkout_session_line_items_session_idx on "stripe"."checkout_session_line_items" using btree (checkout_session);
create index stripe_checkout_session_line_items_price_idx on "stripe"."checkout_session_line_items" using btree (price);

create trigger handle_updated_at
    before update
    on stripe.checkout_session_line_items
    for each row
    execute procedure set_updated_at();

-- 0037_add_features.sql
create table
    if not exists "stripe"."features" (
        "id" text primary key,
        object text,
        livemode boolean,
        name text,
        lookup_key text unique,
        active boolean,
        metadata jsonb,
        updated_at timestamptz default timezone('utc'::text, now()) not null,
        last_synced_at timestamptz
    );

create trigger handle_updated_at
    before update
    on stripe.features
    for each row
    execute procedure set_updated_at();

-- 0038_active_entitlement.sql
create table
    if not exists "stripe"."active_entitlements" (
        "id" text primary key,
        "object" text,
        "livemode" boolean,
        "feature" text,
        "customer" text,
        "lookup_key" text unique,
        "updated_at" timestamptz default timezone('utc'::text, now()) not null,
        "last_synced_at" timestamptz
    );

create index stripe_active_entitlements_customer_idx on "stripe"."active_entitlements" using btree (customer);
create index stripe_active_entitlements_feature_idx on "stripe"."active_entitlements" using btree (feature);

create trigger handle_updated_at
    before update
    on stripe.active_entitlements
    for each row
    execute procedure set_updated_at();

-- 0039_add_paused_to_subscription_status.sql
ALTER TYPE "stripe"."subscription_status" ADD VALUE 'paused';

-- 0040_invoice_payments.sql
create table
    if not exists "stripe"."invoice_payments" (
        "id" text primary key,
        object text,
        amount_paid bigint,
        amount_requested bigint,
        created integer,
        currency text,
        invoice text,
        is_default boolean,
        livemode boolean,
        payment jsonb,
        status text,
        status_transitions jsonb,
        last_synced_at timestamptz,
        updated_at timestamptz default timezone('utc'::text, now()) not null
    );

create index stripe_invoice_payments_invoice_idx on "stripe"."invoice_payments" using btree (invoice);

create trigger handle_updated_at
    before update
    on stripe.invoice_payments
    for each row
    execute procedure set_updated_at();

-- 0041_add_billing_mode.sql
-- Add billing_mode column to subscriptions and subscription_schedules tables
-- This field stores the billing mode configuration for flexible billing support
-- See: https://docs.stripe.com/billing/subscriptions/billing-mode

ALTER TABLE "stripe"."subscriptions" 
ADD COLUMN IF NOT EXISTS "billing_mode" jsonb;

ALTER TABLE "stripe"."subscription_schedules" 
ADD COLUMN IF NOT EXISTS "billing_mode" jsonb;

-- 0042_remove_lookup_key_unique.sql
ALTER TABLE stripe.active_entitlements 
DROP CONSTRAINT IF EXISTS active_entitlements_lookup_key_key;


ALTER TABLE stripe.features 
DROP CONSTRAINT IF EXISTS features_lookup_key_key;

