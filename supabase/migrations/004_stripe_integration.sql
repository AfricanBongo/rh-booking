
-- =============================================================================
-- RoyalHouse Booking: stripe_customer_id + checkout trigger
-- =============================================================================

-- Stable Stripe customer reference on profiles
ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;

-- When sync-engine writes a paid checkout session, update our bookings or create merch orders
CREATE OR REPLACE FUNCTION handle_stripe_checkout_completed()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
  v_booking_id uuid;
  v_amount integer;
  v_user_id uuid;
  v_merch_item_id text;
  v_pickup_location_id text;
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
    v_amount := NEW.amount_total;

    UPDATE public.bookings
    SET amount_paid = amount_paid + v_amount
    WHERE id = v_booking_id;

  ELSIF meta->>'type' = 'merch' THEN
    v_user_id := (meta->>'user_id')::uuid;
    v_merch_item_id := meta->>'merch_item_id';
    v_pickup_location_id := meta->>'pickup_location_id';

    IF NOT EXISTS (
      SELECT 1 FROM public.merch_orders WHERE stripe_payment_id = NEW.id
    ) THEN
      INSERT INTO public.merch_orders (user_id, merch_item_id, pickup_location_id, stripe_payment_id, status)
      VALUES (v_user_id, v_merch_item_id, v_pickup_location_id, NEW.id, 'paid');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_stripe_checkout_paid
  AFTER INSERT OR UPDATE ON stripe.checkout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_stripe_checkout_completed();
