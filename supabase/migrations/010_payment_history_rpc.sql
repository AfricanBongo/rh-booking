CREATE OR REPLACE FUNCTION public.get_booking_payment_history(p_booking_id uuid)
RETURNS TABLE (
  id text,
  amount bigint,
  method text,
  status text,
  paid_at timestamptz,
  receipt_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, stripe
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = p_booking_id
      AND bookings.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cs.id,
    cs.amount_total::bigint,
    'card'::text,
    'paid'::text,
    to_timestamp(cs.created),
    NULL::text
  FROM stripe.checkout_sessions cs
  WHERE cs.metadata->>'booking_id' = p_booking_id::text
    AND cs.metadata->>'type' = 'room_payment'
    AND cs.payment_status = 'paid'

  UNION ALL

  SELECT
    i.id,
    i.total,
    'cash'::text,
    'paid'::text,
    to_timestamp(i.created),
    i.hosted_invoice_url
  FROM stripe.invoices i
  WHERE i.metadata->>'booking_id' = p_booking_id::text
    AND i.metadata->>'type' = 'room_payment'
    AND i.status = 'paid'

  ORDER BY 5 DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_payment_history(uuid) TO authenticated;
