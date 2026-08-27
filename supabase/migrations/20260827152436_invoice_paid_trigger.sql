-- Trigger: when sync-engine mirrors an invoice marked "paid" by admin,
-- update bookings.amount_paid or create merch_orders row.
CREATE OR REPLACE FUNCTION handle_stripe_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
  v_booking_id uuid;
  v_user_id uuid;
  v_merch_item_id text;
  v_pickup_location_id text;
  v_amount bigint;
BEGIN
  IF NEW.status != 'paid' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  meta := NEW.metadata;
  IF meta IS NULL THEN
    RETURN NEW;
  END IF;

  v_amount := NEW.total;

  IF meta->>'type' = 'room_payment' THEN
    v_booking_id := (meta->>'booking_id')::uuid;

    IF v_booking_id IS NOT NULL AND v_amount IS NOT NULL THEN
      PERFORM id FROM public.bookings WHERE id = v_booking_id FOR UPDATE;
      UPDATE public.bookings
      SET amount_paid = LEAST(amount_paid + v_amount, total_price)
      WHERE id = v_booking_id;
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
  RAISE WARNING '[handle_stripe_invoice_paid] Unhandled error on invoice %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_stripe_invoice_paid ON stripe.invoices;

CREATE TRIGGER on_stripe_invoice_paid
  AFTER INSERT OR UPDATE ON stripe.invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_stripe_invoice_paid();
