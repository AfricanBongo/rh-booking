-- Grant table-level privileges to service_role for tables accessed by the
-- stripe-checkout edge function (which uses the service role key directly).
--
-- service_role bypasses RLS but still requires explicit GRANT on each table.
--
-- Tables accessed by the edge function:
--   public.bookings     - SELECT (verify ownership + balance) + UPDATE (amount_paid)
--   public.profiles     - SELECT (stripe_customer_id lookup) + UPDATE (save new customer id)
--   public.merch_orders - SELECT (idempotency check) + INSERT (create order on payment)

GRANT SELECT, UPDATE ON public.bookings    TO service_role;
GRANT SELECT, UPDATE ON public.profiles    TO service_role;
GRANT SELECT, INSERT ON public.merch_orders TO service_role;
