-- Helper: void all open invoices for a booking that is now fully paid
CREATE OR REPLACE FUNCTION void_open_invoices_for_booking(p_booking_id uuid)
RETURNS void AS $$
BEGIN
  -- Mark open invoices as 'void' in our local mirror.
  -- The actual Stripe void must be done via API (edge function or admin action).
  -- This prevents the trigger from double-crediting if admin later marks it paid.
  UPDATE stripe.invoices
  SET status = 'void'::stripe.invoice_status
  WHERE metadata->>'booking_id' = p_booking_id::text
    AND metadata->>'type' = 'room_payment'
    AND status = 'open';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace the existing checkout trigger to add void logic after payment
CREATE OR REPLACE FUNCTION handle_stripe_checkout_completed()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
  v_booking_id uuid;
  v_amount integer;
  v_user_id uuid;
  v_merch_item_id text;
  v_pickup_location_id text;
  v_new_amount_paid integer;
  v_total_price integer;
BEGIN
  IF NEW.payment_status != 'paid' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.payment_status = 'paid' THEN
    RETURN NEW;
  END IF;

  meta := NEW.metadata;
  IF meta IS NULL THEN
    RETURN NEW;
  END IF;

  IF meta->>'type' = 'room_payment' THEN
    v_booking_id := (meta->>'booking_id')::uuid;

    IF v_booking_id IS NOT NULL AND NEW.amount_total IS NOT NULL THEN
      v_amount := NEW.amount_total;

      PERFORM id FROM public.bookings WHERE id = v_booking_id FOR UPDATE;
      UPDATE public.bookings
      SET amount_paid = LEAST(amount_paid + v_amount, total_price)
      WHERE id = v_booking_id
      RETURNING amount_paid, total_price INTO v_new_amount_paid, v_total_price;

      -- If booking is now paid in full, void any open cash invoices
      IF v_new_amount_paid >= v_total_price THEN
        PERFORM void_open_invoices_for_booking(v_booking_id);
      END IF;
    END IF;

  ELSIF meta->>'type' = 'merch' THEN
    v_user_id := (meta->>'user_id')::uuid;
    v_merch_item_id := meta->>'merch_item_id';
    v_pickup_location_id := meta->>'pickup_location_id';

    IF v_user_id IS NOT NULL AND v_merch_item_id IS NOT NULL AND v_pickup_location_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.merch_orders WHERE stripe_payment_id = NEW.id
      ) THEN
        INSERT INTO public.merch_orders (user_id, merch_item_id, pickup_location_id, stripe_payment_id, status)
        VALUES (v_user_id, v_merch_item_id, v_pickup_location_id, NEW.id, 'paid');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[handle_stripe_checkout_completed] Unhandled error on session %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
