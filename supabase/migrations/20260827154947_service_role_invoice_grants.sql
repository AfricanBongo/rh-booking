-- The void_open_invoices_for_booking function (SECURITY DEFINER) needs to
-- UPDATE stripe.invoices. Grant to service_role as well since the edge
-- function may also need to read invoices in future.
GRANT SELECT, UPDATE ON stripe.invoices TO service_role;
GRANT USAGE ON SCHEMA stripe TO service_role;
